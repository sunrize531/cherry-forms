from tornado.web import RequestHandler
from cherryforms import widgets


class ResourceDumper(RequestHandler):
    def get(self, *args, **kwargs):
        self.write([
            {'_id': 'COINS'},
            {'_id': 'GLASS'},
            {'_id': 'DIAMONDS'},
            {'_id': 'PRANA'}
        ])


class StashField(widgets.Field):
    widget = 'Stash'
    field_class = 'chf-field-stash'
    _handlers = ('\/widgets\/resources\/', ResourceDumper),
