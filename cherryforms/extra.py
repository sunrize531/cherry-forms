from cherryforms.widgets import *


class StashField(Field):
    widget = 'Stash'
    field_class = 'chf-field-stash'
    handlers = {}


class TranslationField(Field):
    widget = 'Translation'
    field_class = 'chf-field-translation'
    handlers = {}