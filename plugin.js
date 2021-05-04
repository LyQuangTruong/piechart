var d3 = require('d3')

PieChart.defaultSettings = {
	"label": "gender",
	"value": "temperature",
	"timestamp": "ts",
	"xTitle": "Percentage by age",
	"filterRange": "[[0, 33.99], [34, 34.9999], [35, 35.9999], [36, 36.9999], [37, 37.9999], [37.5, 50]]",
	"labelList": '["-34","34-","35-","36-","37-","37.5-"]',
};

PieChart.settings = EnebularIntelligence.SchemaProcessor([
	// {
	// 	type: "key", name: "label", help: "Please specify the key of the data to be the label."
	// },
	{
		type: "text",
		name: "labelList",
		help: "Label list",
	},
	{
		type: "key", name: "value", help: "Please specify the key of the data representing the value."
	},
	{
		type: "text",
		name: "filterRange",
		help: "Filter range",
	},
	{
		type: "text",
		name: "xTitle",
		help: "X axis title",
	},
]);

function PieChart(settings, options) {
	var that = this;
	this.el = window.document.createElement('div');
	var width = options.width || 680;
	var height = options.height || 450;
	that.radius = Math.min(width, height) / 2 - 40;

	this.settings = settings
	this.pieChartWidth = 585;
	this.pieChartHeight = 295;
	this.colorPallete = ['#ffc93c', '#dbf6e9', '#9ddfd3', '#31326f', '#d9d9d8', '#536162', '#424642', '#c06014', '#e40017', '#70C1B3'];
	this.scaleRatio = 1;
	// this.color_list = ["#70C1B3", "#247BA0", "#FFE066", "#F25F5C", "#50514F", "#F45B69", "#211103", "#5C8001", "#23395B", "#470063"];
	this.options = options;

	this.svg = d3.select(this.el)
		.append("svg")
		.attr('class', 'svgWrapper');

	this.base = this.svg
		.attr('width', width)
		.attr('height', height)
		.append("g")
		.attr('class', 'piechart');

	this.base.append("text")
		.attr("class", "piechart__title").style("text-anchor", "middle");
	this.base.append("g")
		.attr("class", "piechart__slices")
		.attr("transform", "translate(" + 0 + "," + -20 + ")");
	this.svg.append("g")
		.attr("class", "piechart__labels");



	this.pie = d3.layout.pie()
		.sort(null)
		.value(function (d) {
			return that.getValue(d);
		});

	this.arc = d3.svg.arc()
		.outerRadius(that.radius * 0.8)
		.innerRadius(0);

	// this.outerArc = d3.svg.arc()
	// 	.innerRadius(that.radius * 0.9)
	// 	.outerRadius(that.radius * 0.9);

	this.base.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

	this.data = [];

	this.setSchema(settings);
}

/*
PieChart.prototype.onDrillDown = function(cb) {
}
*/

PieChart.prototype.addData = function (data) {
	var that = this;

	function fireError(err) {
		if (that.errorCallback) {
			that.errorCallback({
				error: err
			})
		}
	}

	if (data instanceof Array) {
		var label = this.settings.label
		var value = this.settings.value

		this.data = data
			.filter(d => {
				let hasLabel = d.hasOwnProperty(label)
				const dLabel = d[label]
				if (typeof dLabel !== 'string' && typeof dLabel !== 'number') {
					fireError('label is not a string or number')
					hasLabel = false
				}
				return hasLabel
			})
			.filter(d => {
				let hasValue = d.hasOwnProperty(value)
				if (typeof d[value] !== 'number') {
					fireError('value is not a number')
					hasValue = false
				}

				return hasValue
			})

		this.refresh();
	}
	// console.log('this.data ', this.data);
}

PieChart.prototype.clearData = function () {
	this.data = [];
	this.refresh();
}

PieChart.prototype.calculate = function () {
	var that = this;
	var newdata = {};

	// let range = [[0, 9], [10, 19], [20, 29], [30, 39], [40, 49], [50, 59], [60, 69]];// range of age
	// let labelList = ["0-9", "10-19", "20-29", "30-39", "40-49", "50-59", "60-69"];
	// let range = [[0, 33.99], [34, 34.9999], [35, 35.9999], [36, 36.9999], [37, 37.9999], [37.5, 50]];// range of temperature
	// let labelList = ["-34","34-","35-","36-","37-","37.5-"];
	let range = JSON.parse(this.settings.filterRange);
	let labelList = JSON.parse(this.settings.labelList);

	for (let i = 0; i < range.length; i++) {
		const [min, max] = range[i];

		let label = labelList[i];
		this.totalRecord = 0;
		this.data.forEach(datum => {
			if (!newdata[label]) newdata[label] = 0;
			let val = datum[that.settings.value];

			if (min <= val && val <= max) {
				newdata[label] += 1;
			}
			that.totalRecord += 1;
		})
	}

	return Object.keys(newdata).map(function (k) {
		return {
			key: k,
			value: newdata[k]
		}
	}).sort(function (a, b) {
		if (a.key < b.key) return -1;
		if (a.key > b.key) return 1;
		return 0;
	})
}

PieChart.prototype.setSchema = function (schema) {
	this.schema = schema;
}

PieChart.prototype.getLabel = function (d) {
	return d.data.key;
}

PieChart.prototype.getValue = function (d) {
	return d.value;
}

PieChart.prototype.refresh = function () {
	this.change(this.calculate());
}

PieChart.prototype.resize = function (options) {
	this.radius = Math.min(options.width, options.height) / 2 - 40;
	this.width = options.width;
	this.height = options.height;
	this.margin = {
		top: 30,
		left: 30,
		bottom: 30,
		right: 30
	};

	var xRatio = (options.width - this.margin.left - this.margin.right) / this.pieChartWidth;
	var yRatio = (options.height - this.margin.top - this.margin.bottom) / this.pieChartHeight;

	this.scaleRatio = (xRatio > yRatio) ? yRatio : xRatio;
	if (this.scaleRatio > 1) this.scaleRatio = 1;

	var translate = {
		x: options.width / 2 / this.scaleRatio,
		y: options.height / 2 / this.scaleRatio
	}

	// this.arc = d3.svg.arc()
	// 	.outerRadius(this.radius * 0.8)
	// 	.innerRadius(this.radius * 0.4);

	this.arc
		// .innerRadius(this.radius * 0.9)
		.outerRadius(this.radius * 0.8);

	// this.svg
	// 	.attr("width", options.width)
	// 	.attr("height", options.height);

	this.base
		.attr("width", options.width)
		.attr("height", options.height)
		.transition().duration(500)
		.attr("transform", "scale(" + this.scaleRatio + "," + this.scaleRatio + ") translate(" + translate.x + "," + translate.y + ")");

	this.base.select('.piechart')
		.attr('width', options.width)
		.attr('height', options.height);

	/* ------- PIE TITLE -------*/
	this.base.select(".piechart__title")
		.attr('transform', "translate(" + 0 + "," + this.height / 2.5 + ")")
		.text(this.settings.xTitle);

	this.svg.select(".piechart__labels")
		.style('transform', "translateX(" + (this.width - 80) + "px)")
}

PieChart.prototype.change = function (data) {
	var that = this;
	var key = function (d) {
		return that.getLabel(d);
	};


	/* ------- PIE SLICES -------*/
	var slice = this.base.select(".piechart__slices").selectAll("path.piechart__slice")
		.data(this.pie(data), key);

	// SLICE VALUE TEXT
	slice.enter()
		.append("text")
		.attr("class", function (_, i) {
			return `piechart__slice-text-${i} opacity-0`;
		})
		.attr("transform", function (d) {
			var _d = that.arc.centroid(d);
			_d[0] *= 2.5;	//multiply by a constant factor
			_d[1] *= 2.5;	//multiply by a constant factor
			return "translate(" + _d + ")";
		})
		.attr("dy", "0.40em")
		.style("text-anchor", "middle")
		.text(function (d) {
			if (that.getValue(d) > 0) {
				let percentage = that.getValue(d) * 100 / that.totalRecord;
				return percentage.toFixed(2) + '%';
			}
			return '';
		});
	slice.exit()
		.remove();

	slice.enter()
		.insert("path")
		.on("mouseover", function (datum, i) {
			d3.select(this)
				.transition()
				.duration(200)
				.attr({
					transform: 'scale(1.1)',
				});

			d3.select(`.piechart__slice-text-${i}`)
				.classed(`opacity-0`, false);
		})
		.on("mouseout", function (datum, i) {
			d3.select(this)
				.transition()
				.duration(200)
				.attr({
					transform: 'scale(1)',
				});

			d3.select(`.piechart__slice-text-${i}`)
				.classed(`opacity-0`, true);
		})
		.style("fill", function (d, i) { return that.colorPallete[i] })
		.attr("class", "piechart__slice");

	slice.exit()
		.remove();

	slice
		.transition()
		.duration(1000)
		.attrTween("d", function (d) {
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function (t) {
				return that.arc(interpolate(t));
			};
		})



	/* ------- LEGEND TEXT -------*/
	let legendSize = 10;
	var legends = this.svg.select(".piechart__labels")
		.selectAll("path.piechart__labels")
		.data(data);

	legends.enter()
		.append("text")
		.attr("class", "legend-label")
		.text(function (d) {
			return d.key;
		})
		// .attr("x", (that.width - 80))
		.attr("x", 0)
		.attr("y", function (d, i) {
			return that.margin.top + (i * 28)
		})
		// .attr("font-size", "18px")
		.attr("fill", "#888")
		// .attr("font-family", "Arial, Helvetica, sans-serif")
		.style("text-anchor", "start");
	legends.exit().remove();

	legends.enter()
		.append("rect")
		.attr({
			class: `legend-color`,
			// x: (that.width - 80 - (legendSize * 2)),
			x: - (legendSize * 2),
			y: function (d, i) { return that.margin.top + (i * 28) - legendSize },
			width: legendSize,
			height: legendSize,
			fill: function (d, i) { return that.colorPallete[i] },
			cursor: "pointer"
		});
	legends.exit().remove();
};


PieChart.prototype.getEl = function () {
	return this.el;
}

PieChart.prototype.createDialog = function () {
	return {
		properties: [{
			name: 'value',
			type: 'property'
		}]
	}
}

window.EnebularIntelligence.register('piechart', PieChart);

module.exports = PieChart;