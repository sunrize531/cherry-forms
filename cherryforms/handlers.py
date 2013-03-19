from json import loads
from tornado.web import RequestHandler

from cherrycommon.pathutils import norm_path
from cherrycommon.handlers import CherryStaticHandler as _CherryStaticHandler
from cherrycommon.handlers import CherryTemplateLoader as _CherryTemplateLoader
from cherrycommon.handlers import CherryURLSpec

from cherryforms import module_path, CherryFormsSettings, _DEFAULT, _DEFAULT_SETTINGS


class CherryFormsURLSpec(CherryURLSpec):
    def __init__(self, pattern, handler_class, kwargs=None, prefix=_DEFAULT):
        if prefix is _DEFAULT:
            prefix = _DEFAULT_SETTINGS['prefix']
        super(CherryFormsURLSpec, self).__init__(pattern, handler_class, kwargs, prefix)


class CherryTemplateLoader(_CherryTemplateLoader):
    def __init__(self, path, **kwargs):
        super(CherryTemplateLoader, self).__init__(path, **kwargs)
        self.path.append(norm_path(module_path, 'templates'))


class CherryStaticHandler(_CherryStaticHandler):
    def initialize(self, path=(), default_filename=None):
        super(CherryStaticHandler, self).initialize(path, default_filename)
        self.path.append(norm_path(module_path, 'static'))


class CherryFormsHandler(RequestHandler):
    def get_argument(self, name, default=RequestHandler._ARG_DEFAULT, strip=True):
        argument = super(CherryFormsHandler, self).get_argument(name, default, strip)
        try:
            return loads(argument)
        except (TypeError, ValueError):
            return argument

    @property
    def cherryforms_settings(self):
        return CherryFormsSettings(self.application)

    def get_template_path(self):
        return 'cherryforms'

    def create_template_loader(self, template_path):
        settings = self.application.settings
        if "template_loader" in settings:
            return settings["template_loader"]

        kwargs = {}
        if "autoescape" in settings:
            # autoescape=None means "no escaping", so we have to be sure
            # to only pass this kwarg if the user asked for it.
            kwargs["autoescape"] = settings["autoescape"]

        path = []
        try:
            path.append(settings['template_path'])
        except KeyError:
            pass

        path += self.cherryforms_settings['template_path']
        return CherryTemplateLoader(path, **kwargs)

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

    def post(self, *args, **kwargs):
        getattr(self, '_action_{}'.format(self.action))()
