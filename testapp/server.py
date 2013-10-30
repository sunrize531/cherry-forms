import logging
from tornado.ioloop import IOLoop
from tornado.web import Application, os
from cherrycommon.mathutils import random_id
from cherryforms.handlers import FormHandler
from cherryforms import widgets, extra
from cherrycommon.pathutils import norm_path
from cherrycommon.timeutils import milliseconds


class TestHandler(FormHandler):
    def get(self, *args, **kwargs):
        self.render(
            'test.html',
            time=milliseconds() - milliseconds(days=10),
            grid_data=[{
                '_id': 'document_{}'.format(i),
                'int_field': i,
                'text_field': random_id()
            } for i in range(0, 1000)])

    def post(self, *args, **kwargs):
        print self.request
        print tuple(self.arguments)


if __name__ == '__main__':
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
    app.listen(8000)
    IOLoop.instance().start()
