import inspect
import os
from collections import MutableMapping
from copy import deepcopy
from zlib import crc32
from tornado.template import BaseLoader, Template
from tornado.web import URLSpec

from cherrycommon.pathutils import norm_path, file_path


module_path = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))

_DEFAULT = object()
_DEFAULT_SETTINGS = {
    'static_handlers': False,
    'widget_handlers': True,
    'static_prefix': '/cherryforms/',
    'handlers_prefix': '/chf-handlers/',
    'static_path': [],
    'template_path': [],
    '_handlers': {},
    '_updated': True
}


class CherryFormsSettings(MutableMapping):
    def __init__(self, application):
        self.settings = application.settings.setdefault('cherryforms', {})
        if not self.settings.get('_updated'):
            for key, value in deepcopy(_DEFAULT_SETTINGS).iteritems():
                self.settings.setdefault(key, value)

    def __getitem__(self, item):
        return self.settings[item]

    def __setitem__(self, key, value):
        self.settings[key] = value

    def __delitem__(self, key):
        del self.settings[key]

    def __iter__(self):
        return self.settings.__iter__()

    def __len__(self):
        return len(self.settings)


class CherryFormsURLSpec(URLSpec):
    def __init__(self, pattern, handler_class, kwargs=None, prefix=_DEFAULT):
        if prefix is _DEFAULT:
            prefix = _DEFAULT_SETTINGS['prefix']
        if not prefix.startswith('^'):
            prefix = '^' + prefix
        pattern = '{}{}'.format(prefix, pattern)
        name = 'chf-{:05x}'.format(crc32(str(pattern)) & 0xfffff)
        super(CherryFormsURLSpec, self).__init__(pattern, handler_class, kwargs, name)

    def __eq__(self, other):
        if isinstance(other, basestring):
            return self.name == other
        else:
            return self.name == other.name


class CherryTemplateLoader(BaseLoader):
    def __init__(self, path, **kwargs):
        super(CherryTemplateLoader, self).__init__(**kwargs)
        self.path = map(norm_path, path)
        self.path.append(norm_path(module_path, 'templates'))

    def resolve_path(self, name, parent_path=None):
        return file_path(name, self.path)

    def _create_template(self, name):
        with open(name, 'rb') as f:
            return Template(f.read(), name=name, loader=self)
