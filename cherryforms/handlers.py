from json import loads
from tornado.web import RequestHandler

from cherrycommon.pathutils import norm_path
from cherrycommon.handlers import CherryTemplateLoader, CherryRequestHandler, CherryStaticHandler

from cherryforms import module_path, CherryFormsSettings


class FormsStaticHandler(CherryStaticHandler):
    def initialize(self, path=(), default_filename=None):
        super(FormsStaticHandler, self).initialize(path, default_filename)
        self.path.append(norm_path(module_path, 'static'))


_module_templates_path = norm_path(module_path, 'templates')


class FormHandler(CherryRequestHandler):
    @property
    def cherryforms_settings(self):
        return CherryFormsSettings(self.application)

    def initialize(self, templates_path=(), **kwargs):
        super(FormHandler, self).initialize(templates_path=templates_path, **kwargs)
        self.templates_path += self.cherryforms_settings['template_path']
        self.templates_path.append(_module_templates_path)

    def get_argument(self, name, default=RequestHandler._ARG_DEFAULT, strip=True):
        argument = super(FormHandler, self).get_argument(name, default, strip)
        try:
            return loads(argument)
        except (TypeError, ValueError):
            return argument

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

# TODO: fix in applications and remove
CherryFormsHandler = FormHandler