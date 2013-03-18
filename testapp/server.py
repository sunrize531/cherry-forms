import logging
from tornado.ioloop import IOLoop
from tornado.web import Application, os
from cherryforms.handlers import CherryFormsHandler
from cherrycommon.pathutils import norm_path
from cherrycommon.timeutils import milliseconds

import widgets

__author__ = 'sunrize'


class TestHandler(CherryFormsHandler):
    def get(self, *args, **kwargs):
        self.render('test.html',
                    time=milliseconds() - milliseconds(days=10))

    def post(self, *args, **kwargs):
        logging.debug(self.arguments)


if __name__ == '__main__':
    app = Application(
        (('^/test', TestHandler),),
        template_path=norm_path(os.curdir, 'templates'),
        ui_modules=widgets,
        cherryforms={
            'static_handlers': True,
            'static_path': [norm_path('static')]
        }
    )
    app.listen(8000)
    IOLoop.instance().start()
