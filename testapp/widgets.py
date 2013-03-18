from tornado.web import RequestHandler
from cherryforms.widgets import *


class ResourceDumper(RequestHandler):
    def get(self, *args, **kwargs):
        self.write([
            {'_id': 'COINS'},
            {'_id': 'GLASS'},
            {'_id': 'DIAMONDS'},
            {'_id': 'PRANA'}
        ])


class StashField(Field):
    widget = 'Stash'
    field_class = 'chf-field-stash'
    handlers = ('\/widgets\/resources\/', ResourceDumper),