
from tornado.web import RequestHandler
from cherryforms.widgets import *
from cherrycommon.dictutils import encode_data, JSON


class ResourceDumper(RequestHandler):
    def get(self, *args, **kwargs):
        self.write(encode_data([
            {'_id': 'COINS'},
            {'_id': 'GLASS'},
            {'_id': 'DIAMONDS'},
            {'_id': 'PRANA'}
        ], JSON))


class StashField(Field):
    widget = 'Stash'
    field_class = 'chf-field-stash'
    handlers = ('resources', ResourceDumper),