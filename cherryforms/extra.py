from cherryforms.widgets import Field


class StashField(Field):
    widget = 'Stash'
    field_class = 'chf-field-stash'
    handlers = []

    @classmethod
    def resources_handler(cls, spec, **kwargs):
        """Decorate resources collection handler to provide widget with resources collection
        """
        def register_handler(handler):
            cls.handlers = (spec, handler, kwargs),
            return handler
        return register_handler


class TranslationField(Field):
    widget = 'Translation'
    field_class = 'chf-field-translation'
    handlers = []

    @classmethod
    def translations_handler(cls, spec, **kwargs):
        """Decorate translations CRUD handler
        """
        def register_handler(handler):
            cls.handlers.append((spec, handler, kwargs))
            return handler
        return register_handler

    @classmethod
    def languages_handler(cls, spec, **kwargs):
        """Decorate languages handler
        """
        def register_handler(handler):
            cls.handlers.append((spec, handler, kwargs))
            return handler
        return register_handler

    def __init__(self, handler):
        super(TranslationField, self).__init__(handler)