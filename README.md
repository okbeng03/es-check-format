# es-check-format
参考[es-check](https://www.npmjs.com/package/es-check)，出于以下两个原因做了一些改造：
1. es-check 只支持 `cli` 使用方式，不能很方便地在某个工具库或自动化流程中直接使用，所以将 `核心逻辑` 抽离，提供 `api` 和 `cli` 两种方式；
2. es-check 输出的错误日志格式，在使用了 `webpack` 打包有 `sourcemap` 的情况下，很难定位到源代码，所以这里使用 [source-map](https://www.npmjs.com/package/source-map) 进行了溯源，输出更友好的错误日志；

## 使用方式
### CLI
使用方式跟参数跟 `es-check` 保持一致，但是为了避免冲突，对名称进行了修改
```
npm install es-check-format -g
es-check-format es5 './dist/**/*.js'
```

or
```
npx es-check-format es5 './dist/**/*.js'
```

### API
Install
```
npm install es-check-format -save-dev
```

Example
```
const esCheck = require('es-check-format')

...
const errors = await esCheck({
	context: process.cwd(),
	files: './dist/**/*.js',
	ecmaVersion: 'es5'
})

if (errors.length) {
	console.log(errors)
	/* [{
		file: 'xxx', // 扫描出错的文件
		source: 'xxx', // sourcemap存在时，溯源到的源文件
		location: { line: 1, column: 100 }, // sourcemap存在时是源文件位置，不存在时是出错文件位置
		code: 'xxx' // sourcemap存在时，源文件位置代码
	}]*/
}
```

#### esCheck(options)
* `context`: The base directory, an absolute path, default process.cwd()
* `files`: Array of glob pattern
* `ecmaVersion`: Indicates the ECMAScript version to parse. Default is es5.
* `module`: use ES modules, default false
* `allowHashBang`: supports files that start with hash bang, default false
* `not`: folderName1,folderName2 An array of file/folder names that you would like to ignore. Defaults to `[]`

## 注意
* 项目中使用 `webpack` 打包时，主要解析不到的文件是外部依赖包(*参考[why-es-check](https://www.npmjs.com/package/es-check#why-es-check)*)，而一般外部依赖包会被统一打包到 `common-chunk` 中，由于 [acorn](https://www.npmjs.com/package/acorn) 只要解析失败就会退出，所以不管是 `es-check-format` 还是 `es-check` 都没法遍历到一个文件所有的问题，暂时只能查到一个解决后再继续查。(*如果哪个同学有好的办法，烦请在 issue 中留言*)
