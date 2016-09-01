module.exports = (grunt) => {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		sass: {
			options: {
				style: 'expanded',
				debugInfo: false,
				sourcemap: 'auto',
				loadPath: 'node_modules/bootstrap-sass/assets/stylesheets/'
			},
			dist: {
				src: ['src/sass/bootstrap-range-input.scss'],
				dest: 'dist/css/bootstrap-range-input.css'
			}
		},
		cssmin: {
			options: {
				style: 'expanded',
				debugInfo: true,
				sourceMap: true
			},
			dist: {
				src: ['<%= sass.dist.dest %>'],
				dest: 'dist/css/bootstrap-range-input.min.css'
			}
		},
		watch: {
			scripts: {
				options: {
					spawn: false
				},
				files: ['src/**/*'],
				tasks: 'default'
			}
		}
	})

	// Extracts the paths for each glyphicon as inline svg
	grunt.task.registerTask('glyph2svg', 'Fetches the glyphicons from bootstraps font svg and creates an inline scss version for each.', function(arg1, arg2) {
		grunt.log.writeln('Converting glyphs to inline svg...')

		var parseString = require('xml2js').parseString

		var scssFile = 'src/sass/slider-glyphs.scss'

		var fontFile = 'node_modules/bootstrap/fonts/glyphicons-halflings-regular.svg'
		var lessFile = 'node_modules/bootstrap/less/glyphicons.less'
		var svg = grunt.file.read(fontFile, {encoding: 'utf8'})
		var less = grunt.file.read(lessFile, {encoding: 'utf8'})

		function createSCSS(glyphName, glyphPath) {
			var svg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" version="1.1" viewBox="0 0 1300 1300"><path style="fill:#333" d="${glyphPath}"/></svg>`
			var str = `input.form-control[type="range"][glyphicon="${glyphName}"]::-webkit-slider-thumb {
				background-image: url('${svg}');}`
   			str = str.replace(/\t+/, '\t')
   			return str + '\n'
		}

		parseString(svg, function (err, svg) {
			if (err) return grunt.log.error(err)

			var icons = []
			
			// Get the svg path for each glyphicon from the svg font file
			var glyphs = svg.svg.defs[0].font[0].glyph
			var paths = {}
			for (var id in glyphs) {
				var glyph = glyphs[id].hasOwnProperty('$') ? glyphs[id]['$'] : null
				if (glyph !== null && glyph.hasOwnProperty('unicode') && glyph.hasOwnProperty('d')) {
					paths[glyph.unicode] = glyph.d
				}
			}
			
			// Find the glyphicon name unicode combination
			var lessLines = less.split('\n')
			var re = /\.glyphicon-([a-z\-]+)\s+.+content: ?"\\(.+)"/mg
			for (var i = 0; i < lessLines.length; ++i) {
				var line = lessLines[i]
				var m
				while ((m = re.exec(line)) !== null) {
					if (m.index === re.lastIndex) {
						re.lastIndex++
					}
					var name = m[1]
					var code = String.fromCharCode(parseInt(m[2], 16))
					code = unescape(code)

					if (paths.hasOwnProperty(code)) {
						icons.push({
							name: name,
							path: paths[code]
						})
					}
				}
			}

			// Create the scss file
			var scss = ''
			for (var id in icons) {
				var icon = icons[id]
				scss += createSCSS(icon.name, icon.path)
			}

			grunt.file.write(scssFile, scss, {encoding: 'utf8'})
		})
	})

	// Load npm tasks
	require('load-grunt-tasks')(grunt)

	// Default task(s).
	grunt.registerTask('default', ['glyph2svg', 'sass', 'cssmin'])
}