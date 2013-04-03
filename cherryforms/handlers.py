from json import loads
from tornado.web import RequestHandler

from cherrycommon.pathutils import norm_path
from cherrycommon.handlers import CherryStaticHandler as _CherryStaticHandler
from cherrycommon.handlers import CherryTemplateLoader, CherryURLSpec, CherryRequestHandler

from cherryforms import module_path, CherryFormsSettings, _DEFAULT, _DEFAULT_SETTINGS
# from cherryforms.widgets import CherryFormsModule


class FormsURLSpec(CherryURLSpec):
    def __init__(self, pattern, handler_class, kwargs=None, name=None, prefix=_DEFAULT):
        if prefix is _DEFAULT:
            prefix = _DEFAULT_SETTINGS['prefix']
        super(FormsURLSpec, self).__init__(
            pattern, handler_class, kwargs=kwargs, name=name, prefix=prefix)


class FormsTemplateLoader(CherryTemplateLoader):
    def __init__(self, path, **kwargs):
        super(FormsTemplateLoader, self).__init__(path, **kwargs)
        self.path.append(norm_path(module_path, 'templates'))


class FormsStaticHandler(_CherryStaticHandler):
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


# def get_widget_handlers(include_static=True):
#     _seen = set()
#     specs = []
#     for sub in CherryFormsModule.__subclasses__():
#         if sub in _seen:
#             continue
#         for spec in sub.handlers.iteritems():
#             specs.append(spec)
#     return specs


def register_widget_handler(application, url_spec):
    pass
