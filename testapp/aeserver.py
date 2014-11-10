import os
from wsgiref import simple_server
from tornado.web import Application
from tornado.wsgi import WSGIAdapter
from cherrycommon.pathutils import norm_path
from cherryforms import widgets, extra
from testapp.server import TestHandler

__author__ = 'Ivan'


handlers = widgets.get_widget_handlers(
    templates_path=[norm_path('templates')],
    static_path=[norm_path('static')])
handlers += ('^/test', TestHandler),

print handlers

app = Application(
    handlers,
    template_path=norm_path(os.curdir, 'templates'),
    ui_modules=extra,
    cherryforms={
        'widget_handlers': False,
        'static_handlers': False,
        'static_path': [norm_path('static')]
    }
)

wsgi_app = WSGIAdapter(app)
server = simple_server.make_server('', 8888, wsgi_app)
server.serve_forever()