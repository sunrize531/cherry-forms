from copy import deepcopy
import re
from os import path, curdir
from zlib import crc32
from threading import Lock
from tornado.web import UIModule, URLSpec
from tornado.template import Loader
from cherrycommon.handlers import CherryURLSpec
from cherryforms import CherryFormsSettings, _DEFAULT
from cherryforms.handlers import FormsStaticHandler

_templates_loader = Loader(root_directory=path.join(curdir, 'templates'))
_registered_handlers = {}


class CherryFormsModule(UIModule):
    template = ''
    handlers = {}

    def __init__(self, handler):
        super(CherryFormsModule, self).__init__(handler)
        #Get cherryforms settings for current application
        self.settings = CherryFormsSettings(self.handler.application)

    url_pattern = '{prefix}{url}'

    def prepare_url(self, url, prefix=None, **kwargs):
        if re.match('https?://', url) or url.startswith('/'):
            prefix = ''
        else:
            prefix = prefix or self.settings['static_prefix']
        return self.url_pattern.format(prefix=prefix, url=url, **kwargs)

    @classmethod
    def widget_handler(cls, name, pattern, **kwargs):
        """Decorate handler to register it for specified widget.

        :param pattern: Pattern to be matched. As always, groups will be passed to handler's entry point as positional
                        and named arguments.
        :type pattern: basestring
        """
        def register_handler(handler):
            cls.handlers[name] = CherryURLSpec(pattern, handler, kwargs, name=name)
            return handler
        return register_handler


class Link(CherryFormsModule):
    template = ''

    def render(self, url, prefix=None, **kwargs):
        return self.render_string(self.template, url=self.prepare_url(url, prefix, **kwargs), **kwargs)


class CSSLink(Link):
    template = 'css_link.html'
    url_pattern = '{prefix}css/{url}'


class LessLink(CSSLink):
    template = 'less_link.html'


class JSLink(Link):
    template = 'js_link.html'
    url_pattern = '{prefix}js/{url}'

    def render(self, file_name, prefix=None, defer=False, async=False):
        return super(JSLink, self).render(file_name, prefix, defer=defer, async=async)


class Button(UIModule):
    template = 'button.html'

    def render(self, button_id, label=None, bootstrap_type=None, **kwargs):
        return self.render_string(
            self.template, id=button_id, label=label or button_id, bootstrap_type=bootstrap_type, **kwargs)


class Field(CherryFormsModule):
    template = 'field.html'
    widget = 'Field'
    field_class = ''

    _javascript_files = ()
    _required_modules = ()
    _embedded_javascript = ''
    _css_files = ()
    _less_files = ()
    _fields = {}

    def javascript_files(self):
        return [self.prepare_url(url) for url in self._javascript_files]

    def embedded_javascript(self):
        class_name = self.__class__.__name__
        return self.render_string(
            'embedded_js.html',
            modules=['core'] + list(self._required_modules),
            class_name=class_name,
            fields=self._fields.pop(class_name, {}),
            less=self._less_files,
            css=self._css_files,
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


class NumberField(TextField):
    widget = 'Number'


class TimeDelta(TextField):
    widget = 'TimeDelta'


class DateField(Field):
    widget = 'Date'


class FileField(Field):
    widget = 'File'
    field_class = 'chf-field-file'


class TextArea(Field):
    widget = 'TextArea'
    field_class = 'chf-field-textarea'


class SelectField(Field):
    widget = 'Select'


class PillsField(Field):
    widget = 'Pills'
    field_class = 'chf-field-pills'


class RadioGroup(Field):
    widget = 'RadioGroup'
    field_class = 'chf-field-buttons-group'


class CheckBox(Field):
    widget = 'CheckBox'
    field_class = 'chf-field-checkbox'


class ListField(Field):
    widget = 'List'
    field_class = 'chf-field-list'


class ObjectField(Field):
    widget = 'Object'
    field_class = 'chf-field-object'


class DocumentField(Field):
    widget = 'Document'
    field_class = 'chf-field-document'


class DocumentListField(Field):
    widget = 'DocumentList'
    field_class = 'chf-field-document-list'


class DocumentGridField(Field):
    widget = 'DocumentGrid'
    field_class = 'chf-field-document-grid'


class TreeField(Field):
    widget = 'Tree'
    field_class = 'chf-field-tree'


class LineChart(Field):
    widget = 'LineChart'
    field_class = 'chf-field-chart'


class PieChart(Field):
    widget = 'PieChart'
    field_class = 'chf-field-chart'


class ColumnChart(Field):
    widget = 'ColumnChart'
    field_class = 'chf-field-chart'


def get_widget_handlers(templates_path=(), static_path=(), no_static=False, **kwargs):
    _seen = set()
    specs = []
    subclasses_queue = list(CherryFormsModule.__subclasses__())
    while subclasses_queue:
        sub = subclasses_queue.pop(0)
        if sub in _seen:
            continue
        subclasses_queue += list(sub.__subclasses__())
        for spec in sub.handlers.itervalues():
            specs.append(spec)

    if not no_static:
        specs.append(('/cherryforms/(.*)', FormsStaticHandler, {'path': static_path}))
    return specs


def register_widget_handler(application, url_spec):
    pass
