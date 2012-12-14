from os import curdir, path
from tornado.web import StaticFileHandler
from cherryforms import CherryFormsURLSpec

class CherryStaticHandler(StaticFileHandler):
    def initialize(self, path, default_filename=None):
        path = path or path.abspath(path.join(curdir, 'static'))
        super(CherryStaticHandler, self).initialize(path, default_filename)

cherry_static_spec = CherryFormsURLSpec('static/(.*)', CherryStaticHandler, {}, 'cherryforms#static')