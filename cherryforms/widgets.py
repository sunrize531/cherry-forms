from copy import deepcopy
import re
from os import path, curdir
from zlib import crc32
from threading import Lock
from tornado.web import UIModule, URLSpec
from tornado.template import Loader
from cherryforms import CherryFormsURLSpec, CherryFormsSettings, _DEFAULT
from cherryforms.handlers import CherryStaticHandler

_templates_loader = Loader(root_directory=path.join(curdir, 'templates'))
_registered_handlers = {}

class CherryFormsModule(UIModule):
    template = ''
    handlers = ()

    def __init__(self, handler):
        super(CherryFormsModule, self).__init__(handler)

        #Get cherryforms settings for current application
        self.settings = CherryFormsSettings(self.handler.application)

        #Register static and required handlers if any.
        self.register_handlers(handler)

    @staticmethod
    def _add_handler(handlers_list, spec):
        handlers_list.append(URLSpec(*spec))

    def _add_handlers(self, specs):
        app_handlers = self.handler.application.handlers
        last_handlers = app_handlers[-1]
        last_host = last_handlers[0]
        if last_host == '.*$':
            lists_to_add = [last_handlers[1]]
        else:
            lists_to_add = [handlers[1] for handlers in app_handlers]
        for spec in specs:
            for handlers_list in lists_to_add:
                if spec not in handlers_list:
                    handlers_list.append(spec)

    def _is_registered(self, host, spec):
        registered_handlers = self.settings['_handlers'].setdefault('host', set())
        return spec.name in registered_handlers

    def register_handlers(self):
        """This function will add cherryforms handlers in current application. If application uses virtual hosts,
        and no wildcard host handlers configured yet, method will try to add cherryforms handlers
        in all configured virtual hosts.
        """
        host = self.handler.request.host
        specs = []
        prefix = self.settings['prefix']
        if self.settings['static_handlers']:
            spec = CherryFormsURLSpec('static/(.*)', CherryStaticHandler, prefix=prefix)
            if not self._is_registered(host, spec):
                specs.append(spec)

        if self.handlers and self.settings['widget_handlers']:
            for spec in self.handlers:
                if isinstance(spec, (tuple, list)):
                    l = len(spec)
                    if 2 <= l < 4:
                        spec = CherryFormsURLSpec(*spec, prefix=prefix)
                    elif l == 4:
                        spec = CherryFormsURLSpec(*spec)
                    else:
                        raise AttributeError('Invalid spec')
                elif isinstance(spec, dict):
                    spec = deepcopy(spec)
                    spec.setdefault('prefix', prefix)
                    spec = CherryFormsURLSpec(**spec)

                if not self._is_registered(host, spec):
                    specs.append(spec)






    @classmethod
    def register_handlers(cls, handler):
        """This function will add cherryforms handlers in current application. If application uses virtual hosts,
        and no wildcard host handlers configured yet, method will add cherryforms handlers for all hosts.
        """
        application = handler.application
        settings = application.settings.setdefault('cherryforms', {})
        url_prefix = settings.setdefault('url_prefix', 'cherryforms/')
        specs = []
        if not settings.get('disable_static_handlers', True) and not settings.get('static_handlers_registered'):
            settings['static_handlers_registered'] = True
            specs.append(('{}static/(.+)'.format(url_prefix), CherryStaticHandler))

        if cls.handlers and not settings.get('disable_field_handlers', False):
            registered_field_handlers = settings.setdefault('registered_field_handlers', {})
            field_class = cls.__name__
            if not registered_field_handlers.get(field_class):
                specs += list(cls.handlers)

        if specs:
            cls._add_handlers(application, specs)

class Link(CherryFormsModule):
    template = ''
    prefix = None
    url_pattern = '{prefix}{file_name}'

    def get_file_url(self, file_name, prefix=None):
        prefix = prefix or self.get_settings_value('url_prefix', 'cherryforms/')


class Link(UIModule):
    template = ''
    prefix_pattern = ''
    file_name_pattern = '{}{}'

    @classmethod
    def get_file_name(cls, file_name, prefix=None):
        if re.match('https?://', file_name):
            prefix = ''
        elif prefix:
            prefix = cls.prefix_pattern.format(prefix)
        return cls.file_name_pattern.format(prefix, file_name)

    def render(self, file_name, prefix=None, **kwargs):
        template = _templates_loader.load(self.template)
        return template.generate(file_name=self.get_file_name(file_name, prefix), **kwargs)

class CSSLink(Link):
    template = 'css_link.html'
    prefix_pattern = '{}css/'

class LessLink(Link):
    template = 'less_link.html'
    prefix_pattern = '{}css/'

class JSLink(Link):
    template = 'js_link.html'
    prefix_pattern = '{}js/'

    def render(self, file_name, prefix=None, defer=False, async=False):
        return super(JSLink, self).render(file_name, prefix, defer=defer, async=async)

class Button(UIModule):
    template = 'button.html'
    def render(self, id, label=None, bootstrap_type=None, **kwargs):
        return self.render_string(self.template, id=id, label=label or id, bootstrap_type=bootstrap_type, **kwargs)


class Field(UIModule):
    template = 'widgets/field.html'
    widget = 'Field'
    field_class = ''
    _javascript_files = ()
    _required_modules = ()
    _embedded_javascript = ''
    _css_files = ()
    _less_files = ()
    _handlers = ()
    _fields = {}

    def __init__(self, handler):
        super(Field, self).__init__(handler)
        self.register_handlers(handler)

    def javascript_files(self):
        return [JSLink.get_file_name(file_name) for file_name in self._javascript_files]

    def embedded_javascript(self):
        class_name = self.__class__.__name__
        return self.handler.render_string('widgets/embedded_js.html',
            modules=['core'] + list(self._required_modules),
            class_name=class_name,
            fields=self._fields.pop(class_name, {}),
            less=self._less_files,
            embedded=self._embedded_javascript
        )

    _fields_counter = 0
    _fields_lock = Lock()
    _field_id_pattern = '{}|{}|{}'
    @classmethod
    def get_field_id(cls, field):
        field_id_src = cls._field_id_pattern.format(field, cls.widget, cls._fields_counter)
        cls._fields_lock.acquire()
        cls._fields_counter = (cls._fields_counter + 1) % 0xFF
        cls._fields_lock.release()
        return '{:05x}'.format(crc32(field_id_src) & 0xfffff)

    _handlers_registered = False
    @classmethod
    def register_handlers(cls, handler):
        if not cls._handlers_registered:
            handlers = handler.application.handlers
            try:
                handlers_list = handlers[-1][1]
            except IndexError:
                pass
            else:
                for pattern, handler_class in cls._handlers:
                    handlers_list.append(URLSpec(pattern, handler_class))
                cls._handlers_registered = True


    def render(self, field='', label='', value='', **kwargs):
        field_id = self.get_field_id(field)
        options = {
            'field': field,
            'field_id': field_id,
            'widget': self.widget,
            'field_class': self.field_class,
            'label': label,
            'value': value
        }
        options.update(kwargs)
        self._fields.setdefault(self.__class__.__name__, []).append(options)
        return self.render_string(self.template, **options)

class HiddenField(Field):
    widget = 'Hidden'

class TextField(Field):
    widget = 'Text'
    _required_modules = 'widgets/text',

class NumberField(TextField):
    widget = 'Number'

class TimeDelta(TextField):
    widget = 'TimeDelta'

class FileField(Field):
    widget = 'File'
    field_class = 'chf-field-file'
    _required_modules = 'widgets/file',

class DateField(Field):
    widget = 'Date'

class TextArea(Field):
    widget = 'TextArea'
    field_class = 'chf-field-textarea'
    _required_modules = 'widgets/text',

class SelectField(Field):
    widget = 'Select'
    _required_modules = 'widgets/select',

class CheckBox(Field):
    widget = 'CheckBox'
    field_class = 'chf-field-checkbox'
    _required_modules = 'widgets/checkbox',

class ListField(Field):
    widget = 'List'
    field_class = 'chf-field-list'
    _required_modules = 'widgets/select', 'widgets/list',

class ObjectField(Field):
    widget = 'Object'
    field_class = 'chf-field-object'

class DocumentField(Field):
    widget = 'Document'
    field_class = 'chf-field-document'
    _required_modules = 'widgets/document',

class DocumentListField(Field):
    widget = 'DocumentList'
    field_class = 'chf-field-document-list'
    _required_modules = 'widgets/document-list',

class DocumentGridField(Field):
    widget = 'DocumentGrid'
    field_class = 'chf-field-document-grid'
    _required_modules = 'widgets/document-grid',

class TreeField(Field):
    widget = 'Tree'
    field_class = 'chf-field-tree'
    _javascript_files = 'widgets/tree.js',
    _css_files = 'chf-tree.css',