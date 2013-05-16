from distutils.core import setup
import os


def get_file_list(path):
    l = []
    for root, sub, files in os.walk('cherryforms', path):
        for f in files:
            l.append(os.path.relpath(os.path.join(root, f), 'cherryforms'))
    return l

setup(
    name='cherry-forms',
    version='0.6.1',
    packages=['cherryforms', ],
    package_data={'cherryforms': get_file_list('templates') + get_file_list('static')},
    url='',
    license='MIT',
    author='WYSEGames',
    author_email='info@wysegames.com',
    description=('Set of UIModules for building forms with Tornado web server. '
                 'Widgets also can be used as standalone on clientside.'),
    install_requires=[
        "tornado >= 2.4",
        "pymongo >= 2.3",
        'cherry-common >= 0.5'
    ],
    dependency_links = [
        "git+git://gitolite@jira.wysegames.com/cherry_common.git"
    ],
)
