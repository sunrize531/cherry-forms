from collections import MutableMapping
from copy import deepcopy
from zlib import crc32
from tornado.web import URLSpec

_DEFAULT = object()
_DEFAULT_SETTINGS = {
    'static_handlers': False,
    'widget_handlers': True,
    'prefix': '^cherryforms/',
    '_handlers': {},
    '_updated': True
}

class CherryFormsSettings(MutableMapping):
    def __init__(self, application):
        self.settings = application.settings.setdefault('cherryforms', {})
        if self.settings.get('_updated'):
            for key, value in deepcopy(_DEFAULT_SETTINGS).iteritems():
                self.settings.setdefault(key, value)

    def __getitem__(self, item):
        return self.settings[item]

    def __setitem__(self, key, value):
        self.settings[key] = value

    def check_handler(self, host, spec):
        registered_handlers = self.settings['_handlers']


class CherryFormsURLSpec(URLSpec):
    def __init__(self, pattern, handler_class, kwargs=None, prefix=_DEFAULT):
        if prefix is _DEFAULT:
            prefix = _DEFAULT_SETTINGS['prefix']
        pattern = '{}{}'.format(prefix, pattern)
        name = 'chf-{:05x}'.format(crc32(str(pattern)) & 0xfffff)
        super(CherryFormsURLSpec, self).__init__(pattern, handler_class, kwargs, name)

    def __eq__(self, other):
        if isinstance(other, basestring):
            return self.name == other
        else:
            return self.name == other.name

