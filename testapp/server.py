from tornado.ioloop import IOLoop
from tornado.web import Application, os
from cherryforms import norm_path, widgets
from cherryforms.handlers import CherryFormsHandler

__author__ = 'sunrize'

class TestHandler(CherryFormsHandler):
    def get(self, *args, **kwargs):
        self.render('test.html')

if __name__ == '__main__':
    app = Application((('^/test', TestHandler),),
        template_path=norm_path(os.curdir, 'templates'),
        ui_modules=widgets
    )
    app.listen(8000)
    IOLoop.instance().start()
