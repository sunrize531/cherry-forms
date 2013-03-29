from cherryforms.widgets import Field


class StashField(Field):
    widget = 'Stash'
    field_class = 'chf-field-stash'


class TranslationField(Field):
    widget = 'Translation'
    field_class = 'chf-field-translation'


def resources_handler(Handler):
    """Decorate resources collection handler for Stash widget.
    """


def translations_crud(Handler):
    """Decorate translations CRUD handler for Translations widget.
    """