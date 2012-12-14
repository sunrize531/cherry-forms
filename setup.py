from distutils.core import setup

setup(
    name='cherry-forms',
    version='0.1a',
    packages=['tornado', 'cherryforms'],
    url='',
    license='MIT',
    author='sunrize',
    author_email='sunrize531@gmail.com',
    description='Set of UIModules for building forms with Tornado web server. Widgets also can be used as standalone on clientside.',
    install_requires=[
        "tornado >= 2.4",
    ],
)
