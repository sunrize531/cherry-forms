from tornado.web import RequestHandler
from cherryforms.extra import *
from cherrycommon.dictutils import encode_data, JSON


@StashField.widget_handler('resources', r'cherryforms\/resources\/')
class ResourceDumper(RequestHandler):
    def get(self, *args, **kwargs):
        self.write(encode_data([
            {'_id': 'COINS'},
            {'_id': 'GLASS'},
            {'_id': 'DIAMONDS'},
            {'_id': 'PRANA'}
        ], JSON))
