import hashlib
import mimetypes
import os
import stat
import datetime
import time

from json import loads
from tornado.web import StaticFileHandler, RequestHandler, HTTPError, email
from cherryforms import module_path, norm_path, CherryFormsSettings, CherryTemplateLoader

class CherryStaticHandler(StaticFileHandler):
    def initialize(self, path=(), default_filename=None):
        if isinstance(path, basestring):
            path = path,
        self.path = map(norm_path, path)
        self.path.append(norm_path(module_path, 'static'))

    def find_file(self, file_path):
        for p in self.path:
            norm_file_path = norm_path(p, file_path)
            if os.path.isfile(norm_file_path):
                if norm_file_path.startswith(p):
                    return file_path
                else:
                    raise HTTPError(403)
        raise HTTPError(404)

    def get(self, path, include_body=True):
        path = self.find_file(path)

        stat_result = os.stat(path)
        modified = datetime.datetime.fromtimestamp(stat_result[stat.ST_MTIME])

        self.set_header("Last-Modified", modified)

        mime_type, encoding = mimetypes.guess_type(path)
        if mime_type:
            self.set_header("Content-Type", mime_type)

        cache_time = self.get_cache_time(path, modified, mime_type)
        if cache_time > 0:
            self.set_header("Expires", datetime.datetime.utcnow() + datetime.timedelta(seconds=cache_time))
            self.set_header("Cache-Control", "max-age=" + str(cache_time))
        else:
            self.set_header("Cache-Control", "public")

        self.set_extra_headers(path)

        # Check the If-Modified-Since, and don't send the result if the
        # content has not been modified
        ims_value = self.request.headers.get("If-Modified-Since")
        if ims_value is not None:
            date_tuple = email.utils.parsedate(ims_value)
            if_since = datetime.datetime.fromtimestamp(time.mktime(date_tuple))
            if if_since >= modified:
                self.set_status(304)
                return

        with open(path, "rb") as file:
            data = file.read()
            hasher = hashlib.sha1()
            hasher.update(data)
            self.set_header("Etag", '"%s"' % hasher.hexdigest())
            if include_body:
                self.write(data)
            else:
                assert self.request.method == "HEAD"
                self.set_header("Content-Length", len(data))



class CherryFormsHandler(RequestHandler):
    def get_argument(self, name, default=RequestHandler._ARG_DEFAULT, strip=True):
        argument = super(CherryFormsHandler, self).get_argument(name, default, strip)
        try:
            return loads(argument)
        except (TypeError, ValueError):
            return argument

    def create_template_loader(self, template_path):
        """Returns a new template loader for the given path.

        May be overridden by subclasses.  By default returns a
        directory-based loader on the given path, using the
        ``autoescape`` application setting.  If a ``template_loader``
        application setting is supplied, uses that instead.
        """
        settings = self.application.settings
        if "template_loader" in settings:
            return settings["template_loader"]

        kwargs = {}
        if "autoescape" in settings:
            # autoescape=None means "no escaping", so we have to be sure
            # to only pass this kwarg if the user asked for it.
            kwargs["autoescape"] = settings["autoescape"]

        cherryforms_settings = CherryFormsSettings(self.application)
        return CherryTemplateLoader([template_path] + cherryforms_settings['template_path'], **kwargs)


    def pop_argument(self, name, default=RequestHandler._ARG_DEFAULT, strip=True):
        argument = self.get_argument(name, default, strip)
        del self.request.arguments[name]
        return argument

    action_argument = '_action'
    @property
    def action(self):
        if not hasattr(self, '_action'):
            self._action = self.get_argument(self.action_argument)
        return self._action

    skip_fields = ()
    @property
    def arguments(self):
        arguments = self.request.arguments
        for name in arguments.iterkeys():
            if name not in self.skip_fields:
                yield name, self.get_argument(name)

    def refresh_form(self):
        self.write({'refresh': True})

    def redirect_form(self, url, target=None):
        redirect = {'redirect': url}
        if target:
            redirect['target'] = target
        self.write(redirect)
