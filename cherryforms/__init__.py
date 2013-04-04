import inspect
import os
from collections import MutableMapping
from copy import deepcopy


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
