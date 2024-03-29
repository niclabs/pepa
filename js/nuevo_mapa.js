

let legend_width = 20

let whole_data;
let last_selected_isp = 'all'
let wifi = true;
let mobile = false;
let isp = "all";
let data_wifi = "res/ResultsQOSWiFi.csv";
let data_mobile = "res/ResultsQOSMobile.csv";
let isp_wifi = d3.csv("res/ISPWiFi.csv").then(data => {
	return data;
});
let isp_mobile = d3.csv("res/ISPMobile.csv").then(data => {
	return data;
});



let isp_names = {
	"ENTEL CHILE S.A.": "Entel",
	"Manquehuenet": "Gtd",
	"TELEFONICA CHILE S.A.": "Movistar",
	"VTR BANDA ANCHA S.A.": "Vtr",
	"Telmex Servicios Empresariales S.A.": "Telmex",
	"Pacifico Cable SPA.": "Pacífico",
	"CLARO CHILE S.A.": "Claro",
	"Besthost Spa": "Besthost",
	"SITELCO SPA": "Sitelco",
	"WOM S.A.": "Wom",
	"73007": "Virgin",
	"73009": "Wom",
	"73001": "Entel",
	"73003": "Claro",
	"73002": "Movistar",
	"73008": "Vtr"
}

function selectWifi() {
	var wifi_button = document.getElementById("wifi")
	wifi_button.classList.remove("btn-light")
	wifi_button.classList.add("btn-dark")
	var mobile_button = document.getElementById("mobile")
	mobile_button.classList.remove("btn-dark")
	mobile_button.classList.add("btn-light")

	document.getElementById("tipo_datos").innerHTML="Mostrando Datos WiFi"


	wifi = true;
	mobile = false;
	initialize();

}

function selectMobile() {

	var wifi_button = document.getElementById("wifi")
	wifi_button.classList.remove("btn-dark")
	wifi_button.classList.add("btn-light")
	var mobile_button = document.getElementById("mobile")
	mobile_button.classList.remove("btn-light")
	mobile_button.classList.add("btn-dark")

	document.getElementById("tipo_datos").innerHTML="Mostrando Datos Móviles"

	wifi = false;
	mobile = true;
	initialize();
}

function initialize() {
	document.getElementById("companies")
		.innerHTML = `<button id="all" class="isp_button" onClick="particularIsp('all', 'all');">Mostrar todas</button>`
	if (wifi) {
		generateButtons(isp_wifi);
	}
	if (mobile) {
		generateButtons(isp_mobile);
	}
	last_selected_isp = "all"
	particularIsp("all", "all");
}

function generateButtons(what) {
	what.then(data => {
		let k = 0;
		data.forEach(function(d) {
			document.getElementById("companies").innerHTML +=
				`<button id="isp_${k}" class="isp_button" onclick="particularIsp('${d.isp}', 'isp_${k}'); addTableISP('${d.isp}');">${isp_names[d.isp]} </button>`
			k++;
		})
	})
}

function particularIsp(selectedIsp, button_id) {
	isp = selectedIsp;

	//clear table
	document.getElementById("concrete_table").innerHTML = ""

	//change style to button of selected ISP
	try {
		document.getElementById(last_selected_isp).classList.remove("selected_isp")
		last_selected_isp = button_id
		let button_selected = document.getElementById(button_id)
		button_selected.classList.add("selected_isp")
		d3.select("#svg2").remove();
	} catch {
		console.log("no last_selected_isp")
	}

	if (wifi) {
		generateMap(data_wifi);
	}
	if (mobile) {
		generateMap(data_mobile);
	}
}


function selectIsp(isp, dataset) {
	if(isp=="all"){
		document.getElementById("seleccion_comuna").style.visibility="visible";
	}else{
		document.getElementById("seleccion_comuna").style.visibility="hidden";
	}

	let temp = {};
	let comunas = [];
	if (isp === "all") {
		dataset.forEach(function(d) {
			if (comunas.includes(d.comuna)) {
				temp[d.comuna]["rtt"] += +d.avg_rtt * +d.count;
				temp[d.comuna]["jitter"] += +d.avg_jitter * +d.count;
				temp[d.comuna]["count"] += +d.count;
			} else {
				comunas.push(d.comuna);
				temp[d.comuna] = {
					"rtt": +d.avg_rtt * +d.count,
					"jitter": +d.avg_jitter * +d.count,
					"count": +d.count,
				}
			}
		})
		for (let key in temp) {
			temp[key]["rtt"] /= temp[key]["count"];
			temp[key]["jitter"] /= temp[key]["count"];
		}
	} else {
		dataset.forEach(function(d) {
			if (isp === d.isp) {
				temp[d.comuna] = {
					"rtt": +d.avg_rtt,
					"jitter": +d.avg_jitter,
				}
			}
		});
	}
	let data = [];
	for (let key in temp) {
		data.push({
			"comuna": key,
			"rtt": temp[key]["rtt"],
			"jitter": temp[key]["jitter"],
		})
	}
	return data;
}

function generateMap(dataset_file) {
	document.getElementById("table").style.visibility = "hidden";
	let svg = d3.select("#map");
	svg.style("vertical-align", "top")

	let tooltip_comuna = document.getElementById("tooltip_comuna")

	


	d3.select("#svg2").remove();
	d3.xml("./images/Comunas_de_Santiago_(plain).svg")
		.then(xml => {
			//console.log(document.getElementById("svg2").width.animVal.value)
			let svgMap = xml.documentElement;
			
			d3.select(svgMap)
				.style("float", "left-top")
				.attr("width", "auto")
				.style("vertical-align", "top")
				.on("mouseover", function(e) {
					let selected_comuna = e.target.id;
					SVG(document.getElementById(selected_comuna)).front();
					if(last_selected_isp!="all"){
						document.getElementById(selected_comuna).style.cursor="default";
					}
				})
				.on("click", function(e) {

					let selected_comuna = e.target.id;

					if (selected_comuna == "svg2") {
						return;
					}
					if (document.getElementById(selected_comuna).classList.contains("noData")){
						return;
					}
					
					if (isp == "all"){

						addTableComuna(selected_comuna);
						
					}

					//else
					//console.log(document.getElementById("svg2").getBBox().width);
					//console.log(document.getElementById("svg2").width.animVal.value)
					//addTableISP(isp)
				})
				.selectAll("path")
				.attr("class", "comuna noData")
				.on("mouseenter", function(e) {
					tooltip_comuna.innerHTML = e.target.id.replaceAll("_", " ")
					var size_scale = document.getElementById("svg2").getBBox().width / svgMap.width.animVal.value
					var x = e.clientX,
						y = e.clientY;
					tooltip_comuna.style.top = (this.getBBox().y) / size_scale + 'px';
					tooltip_comuna.style.left = (this.getBBox().x) / size_scale + 'px';
					tooltip_comuna.style.opacity = 100;
				})
				.on("mouseout", function(e) {
					tooltip_comuna.style.opacity = 0;
				});

			svg.node().appendChild(svgMap);
			

			d3.csv(dataset_file).then(data => {
				whole_data = data;
				data = selectIsp(isp, data);
				//console.debug(data);
				//console.debug(data.length);
				const color = d3.scaleQuantile()
					.domain([
						d3.min(data, function(d) {
							return d.rtt;
						}),
						d3.max(data, function(d) {
							return d.rtt;
						})
					])
					.range(colorScaleRedo(data.length));
				var itemsProcessed = 0;
				data.forEach(function(d) {
					d3.select(document.getElementById(d.comuna.replaceAll(" ", "_")))
						.attr("class", "comuna " + color(+d.rtt));
					itemsProcessed++;
					if (itemsProcessed == data.length) {
						let scale_height = svgMap.height.animVal.value * 0.8
						showScale(color, scale_height);
					}
				})

			//	console.log(svgMap)
			//console.log(document.getElementById("svg2"))
			//console.log(document.getElementById("svg2").width.animVal.value)
			var map_height = (document.getElementById("svg2").width.animVal.value)
			//console.log(map_height)
			var table_height = map_height-60;
			//console.log(table_height)
			document.getElementById("concrete_table").style.height = table_height+"px"
			
			});


		});

}

function reportWindowSize(){
	var map_height = (document.getElementById("svg2").width.animVal.value)
	//console.log(map_height)
	var table_height = map_height-60;
	console.log(table_height)
	document.getElementById("concrete_table").style.height = table_height+"px"
}
window.addEventListener('resize', reportWindowSize);

initialize();

function colorScaleRedo(k) {
	//console.debug(`Color scale of ${k} elements`);
	//return ["scale1", "scale3", "scale5"];
	//if (k === 4) {
	//	return ["scale1", "scale2", "scale4", "scale5"];
	//} else if (k === 3) {
	//	return ["scale1", "scale3", "scale5"];
	//} else 
	if (k === 2) {
		return ["scale1", "scale5"];
	} else if (k === 1) {
		return ["scale3"];
	} else {
		//return ["scale1", "scale2", "scale3", "scale4", "scale5"];
		return ["scale1", "scale3", "scale5"];

	}
}

function showTooltip(e,name){
	let tooltip_tabla = document.getElementById("tooltip_tabla")
	var x = e.clientX,
		y = e.clientY;
	//console.log(x)
	//console.log(y)
	if(name=="isp"){
		
		tooltip_tabla.innerHTML = "Proveedor de Servicios de Internet"
	}
	if(name=="rtt"){
		
		tooltip_tabla.innerHTML = "Round Trip Time: es el tiempo promedio de demora de ida y vuelta de los paquetes; menor es mejor."
	}
	if(name=="jitter"){
		
		tooltip_tabla.innerHTML = "Jitter corresponde a la fluctuacion en las tasas de envío de los paquetes; menor es mejor."
	}
	//console.log(tooltip_tabla);
	//console.log(tooltip_tabla.style)
	tooltip_tabla.style.top=y-60+"px"
	tooltip_tabla.style.center=x-100+"px"
	tooltip_tabla.style.opacity = 100;
}

function hideTooltip(){
	let tooltip_tabla = document.getElementById("tooltip_tabla")
	tooltip_tabla.style.opacity = 0;

}

function addTableComuna(comuna) {
	let name_comuna = comuna.replaceAll("_", " ");
	console.debug(`Table of "${name_comuna}"`);
	let is_there = false;
	let table = `<thead>
	<tr>
		<th style="width:50%">ISP <i class="bi-question-circle" style="color: black;" onmouseover = showTooltip(event,"isp"); onmouseout = hideTooltip()></i></th>
		<th style="width:25%">RTT <i class="bi-question-circle" style="color: black;" onmouseover = showTooltip(event,"rtt"); onmouseout = hideTooltip()></i></th>
		<th style="width:25%">Jitter <i class="bi-question-circle" style="color: black"; onmouseover = showTooltip(event,"jitter"); onmouseout = hideTooltip()></i></th>
	</tr></thead>`
	for (let a in whole_data) {
		if (whole_data[a].comuna === name_comuna) {
			if (!is_there) {
				is_there = true;
			}
			console.debug(whole_data[a]);
			table += `<tr><td>${isp_names[whole_data[a].isp]}</td>`
			table += `<td>${(+whole_data[a].avg_rtt).toFixed(2)}</td>`
			table += `<td>${(+whole_data[a].avg_jitter).toFixed(2)}</td></tr>`
		}
	}
	if (is_there) {
		document.getElementById("table_name").innerHTML = name_comuna;
		document.getElementById("table").style.visibility = "visible";
		document.getElementById("concrete_table").innerHTML = `<table>${table}</table>`;
		console.debug(table);
	} else {
		document.getElementById("table").style.visibility = "visible";
		document.getElementById("table_name").innerHTML = name_comuna;
		document.getElementById("concrete_table").innerHTML = "<p>No hay datos</p>"
		//document.getElementById("concrete_table").style.visibility = "hidden";
		console.debug(`No data of "${name_comuna}"`);
	}
}

function addTableISP(isp) {
	let is_there = false;
	let table = `<thead>
	<tr>
		<th style="width:50%">Comuna</th>
		<th style="width:25%">RTT <i class="bi-question-circle" style="color: black;" onmouseover = showTooltip(event,"rtt"); onmouseout = hideTooltip()></i></th>
		<th style="width:25%">Jitter <i class="bi-question-circle" style="color: black"; onmouseover = showTooltip(event,"jitter"); onmouseout = hideTooltip()></i></th>
	</tr></thead>`
	for (let a in whole_data) {
		if (whole_data[a].isp === isp) {
			if (!is_there) {
				is_there = true;
			}
			console.debug(whole_data[a]);
			table += `<tr><td>${[whole_data[a].comuna.replaceAll("_", " ")]}</td>`
			table += `<td>${(+whole_data[a].avg_rtt).toFixed(2)}</td>`
			table += `<td>${(+whole_data[a].avg_jitter).toFixed(2)}</td></tr>`
		}
	}
	if (is_there) {
		document.getElementById("table_name").innerHTML = isp_names[isp];
		document.getElementById("table").style.visibility = "visible";
		document.getElementById("concrete_table").innerHTML = `<table>${table}</table>`;
		console.debug(table);
	} else {
		document.getElementById("table").style.visibility = "visible";
		document.getElementById("table_name").innerHTML = isp_names[isp];
		document.getElementById("concrete_table").innerHTML = "<p>No hay datos</p>"
		//document.getElementById("concrete_table").style.visibility = "hidden";
		console.debug(`No data of "${isp_names[isp]}"`);
	}


}


function showScale(color_fun, legend_height) {
	if (legend_height == 0) {
		legend_height = 600
	}
	legend_height = 400
	let domain = color_fun.domain();
	let range = color_fun.range();
	console.debug(domain);
	console.debug(range);
	d3.select("#svg_scale").remove();
	let svg_scale = d3.select("#map_scale")
		.append("svg")
		.attr("id", "svg_scale")
		.style("width","auto")
		.attr("viewBox","0 0 110 450")
		//.style("height", legend_height + 35)
	let bin = (legend_height - 2 * legend_width) / range.length;
	console.debug(`Bin size on legend: ${bin}px`)
	let y = 15;
	svg_scale.append("text")
		.attr("x", legend_width)
		.attr("y", y)
		.text("RTT")
		//.style("font-family","Margot")
		//.style("fill","#633991")
		.attr("class", "svg_title svg_legend")
	y = y + 20;

	svg_scale.append("text")
		.attr("id", "top_value")
		.attr("x", legend_width + 5)
		.attr("y", y + 10)
		.attr("class", "svg_legend")

		.text(domain[1].toFixed(0));
	for (let a in range) {
		svg_scale.append("rect")
			.attr("y", y)
			.style("width", `${legend_width}px`)
			.style("height", `${bin}px`)
			.attr("class", range[range.length - a - 1]);
		y += bin;
	}
	svg_scale.append("text")
		.attr("id", "bottom_value")
		.attr("x", legend_width + 5)
		.attr("y", y - 5)
		.attr("class", "svg_legend")
		.text(domain[0].toFixed(0));
	svg_scale.append("rect")
		.attr("y", y + legend_width)
		.style("width", `${legend_width}px`)
		.style("height", `${legend_width}px`)
		.attr("class", "noData");
	svg_scale.append("text")
		.attr("x", legend_width + 5)
		.attr("y", y + 1.5 * legend_width + 5)
		.attr("class", "svg_legend")
		.text("Sin datos");
}