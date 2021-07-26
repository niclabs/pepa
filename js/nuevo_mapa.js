      // Read config
      let CONFIG = {};
      $.getJSON('config.json', function (data){
        for(let datum of Object.entries(data)){
          CONFIG[datum[0]] = datum[1];
        }
      });
      let whole_data;
      let last_selected_isp = 'all'
      let wifi = true;
      let mobile = false;
      let isp = "all";
      let data_wifi = "res/ResultsQOSWiFi.csv";
      let data_mobile = "res/ResultsQOSMobile.csv";
      let isp_wifi = d3.csv("res/ISPWiFi.csv").then(data =>{
        return data;
      });
      let isp_mobile = d3.csv("res/ISPMobile.csv").then(data =>{
        return data;
      });



      let isp_names = {
          "ENTEL CHILE S.A.":"Entel",
          "Manquehuenet":"Gtd",
          "TELEFONICA CHILE S.A.":"Movistar",
          "VTR BANDA ANCHA S.A.":"Vtr",
          "Telmex Servicios Empresariales S.A.":"Telmex",
          "Pacifico Cable SPA.":"Pacífico",
          "CLARO CHILE S.A.":"Claro",
          "Besthost Spa":"Besthost",
          "SITELCO SPA":"Sitelco",
          "WOM S.A.":"Wom",
          "73007":"Virgin",
          "73009":"Wom",
          "73001":"Entel",
          "73003":"Claro",
          "73002":"Movistar",
          "73008":"Vtr"
      }

      function selectWifi(){
      	var wifi_button = document.getElementById("wifi")
      	wifi_button.classList.remove("btn-light")
      	wifi_button.classList.add("btn-dark")
      	var mobile_button = document.getElementById("mobile")
      	mobile_button.classList.remove("btn-dark")
      	mobile_button.classList.add("btn-light")


        wifi = true;
        mobile = false;
        initialize();

      }

      function selectMobile(){

      	var wifi_button = document.getElementById("wifi")
      	wifi_button.classList.remove("btn-dark")
      	wifi_button.classList.add("btn-light")
      	
      	var mobile_button = document.getElementById("mobile")
      	mobile_button.classList.remove("btn-light")
      	mobile_button.classList.add("btn-dark")
      	

        wifi = false;
        mobile = true;
        initialize();
      }

      function initialize(){
        document.getElementById("companies")
                .innerHTML = `<button id="all" class="isp_button" onClick="particularIsp('all', 'all');">Mostrar todas</button>`
        if (wifi){
          generateButtons(isp_wifi);
        }
        if (mobile){
          generateButtons(isp_mobile);
        }
        last_selected_isp="all"
        particularIsp("all", "all");
      }

      function generateButtons(what){
        what.then(data => {
          let k = 0;
          data.forEach(function(d){
            //console.log(k, d.isp, isp_names[d.isp]);
            document.getElementById("companies").innerHTML +=
                    `<button id="isp_${k}" class="isp_button" onclick="particularIsp('${d.isp}', 'isp_${k}'); addTableISP('${d.isp}')">${isp_names[d.isp]} </button>`
            k++;
          })
          //console.log(document.getElementById("companies").innerHTML)
        })
      }

      function particularIsp(selectedIsp, button_id){
        isp = selectedIsp;

          //clear table
        document.getElementById("concrete_table").innerHTML =""

        //change style to button of selected ISP
        console.log(last_selected_isp)
        console.log(button_id)
        try{
        	document.getElementById(last_selected_isp).classList.remove("selected_isp")
        	last_selected_isp = button_id
        	let button_selected = document.getElementById(button_id)
        	button_selected.classList.add("selected_isp")
        	d3.select("#svg2").remove();	        
    	}catch{
    		console.log("no last_selected_isp")
    	}
    	
    	if (wifi) {
          generateMap(data_wifi);
        }
        if (mobile) {
          generateMap(data_mobile);
        }

        //console.debug("ISP selected " + selectedIsp);

        
      }


      function selectIsp(isp, dataset){
        let temp = {};
        let comunas = [];
        if(isp==="all"){
          dataset.forEach(function(d){
              if(comunas.includes(d.comuna)){
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
          for(let key in temp){
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
        for(let key in temp){
          data.push({
            "comuna": key,
            "rtt": temp[key]["rtt"],
            "jitter": temp[key]["jitter"],
          })
        }
        return data;
      }

      function generateMap(dataset_file){
        //try{document.getElementById("svg2").remove();}
        //catch(error){
        //  console.log(error)
        //}
        //
        document.getElementById("table").style.visibility = "hidden";
        let svg = d3.select("#map");
        svg.style("vertical-align","top")   
        //let div = d3.select("body").append("div")
        //        .attr("class", "tooltip")
        //        .style("opacity", 0)
             
        
        d3.select("#svg2").remove();
        d3.xml("./images/Comunas_de_Santiago_(plain).svg")
              .then(xml => {
                let svgMap = xml.documentElement;
                d3.select(svgMap)
                        .style("float", "left-top")
                        .attr("height", "100%")
                        .attr("width", "auto")  
                        .style("vertical-align","top")                      
                        .on("mouseover", function(e){
                          let selected_comuna = e.target.id;
                          SVG(document.getElementById(selected_comuna)).front();
                          //console.log(selected_comuna)
                        })
                        .on("click", function(e){
                          let selected_comuna = e.target.id;
                          if(selected_comuna=="svg2"){
                            return;
                          }
                          console.log("Click", selected_comuna);
                          if(isp=="all")
                            addTableComuna(selected_comuna);
                          //else
                            //addTableISP(isp)
                        })
                        .selectAll("path")
                        .style("fill", CONFIG.null_color)
                        .attr("class","comuna")
                        ;
                svg.node().appendChild(svgMap);
                d3.csv(dataset_file).then(data =>{
                  whole_data = data;
                  data = selectIsp(isp, data);
                  //console.debug(data);
                  //console.debug(data.length);
                  const color = d3.scaleQuantile()
                          .domain([
                                  d3.min(data, function(d){
                                    return d.rtt;
                                  }),
                                  d3.max(data, function(d){
                                    return d.rtt;
                                  })
                                  ])
                          .range(colorScaleRedo(data.length));
                  data.forEach(function(d){
                    d3.select(document.getElementById(d.comuna.replaceAll(" ", "_")))
                            .style("fill", color(+d.rtt));
                  })
                  let scale_height = svgMap.height.animVal.value * 0.8
                  showScale(color, scale_height);
                });
              });
      }

      initialize();

      function colorScaleRedo(k){
        console.debug(`Color scale of ${k} elements`);
        if (k === 4){
          return [CONFIG.color_scale[0], CONFIG.color_scale[1], CONFIG.color_scale[3], CONFIG.color_scale[4]];
        } else if (k === 3){
          return [CONFIG.color_scale[0], CONFIG.color_scale[2], CONFIG.color_scale[4]];
        } else if (k === 2){
          return [CONFIG.color_scale[0], CONFIG.color_scale[4]];
        } else if (k === 1){
          return [CONFIG.color_scale[2]];
        } else {
          return CONFIG.color_scale;
        }
      }

      function addTableComuna(comuna){
        let name_comuna = comuna.replaceAll("_", " ");
        console.debug(`Table of "${name_comuna}"`);
        let is_there = false;
        let table = `<tr><th>ISP</th><th>RTT</th><th>Jitter</th></tr>`
        for (let a in whole_data){
          if (whole_data[a].comuna === name_comuna){
            if (! is_there){
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

       function addTableISP(isp){
          //console.log("addTableISP", isp)
        let is_there = false;
        let table = `<tr><th>Comuna</th><th>RTT</th><th>Jitter</th></tr>`
        for (let a in whole_data){
          if (whole_data[a].isp === isp){
            if (! is_there){
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


      function showScale(color_fun,legend_height){
        let domain = color_fun.domain();
        let range = color_fun.range();
        console.debug(domain);
        console.debug(range);
        d3.select("#svg_scale").remove();
        let svg_scale = d3.select("#map_scale")
                .append("svg")
                .attr("id", "svg_scale")
                .style("height", legend_height+15)
        let bin = (legend_height - 2 * CONFIG.legend_width) / range.length;
        console.debug(`Bin size on legend: ${bin}px`)
        let y = 15;
        svg_scale.append("text")
                .attr("id","top_value")
                .attr("x", CONFIG.legend_width + 5)
                .attr("y", y)
                .text(domain[1].toFixed(0));
        for (let a in range) {
          svg_scale.append("rect")
                  .attr("y", y)
                  .style("width", `${CONFIG.legend_width}px`)
                  .style("height", `${bin}px`)
                  .style("fill", range[range.length - a - 1]);
          y += bin;
        }
        svg_scale.append("text")
                .attr("id","bottom_value")
                .attr("x", CONFIG.legend_width + 5)
                .attr("y", y)
                .text(domain[0].toFixed(0));
        svg_scale.append("rect")
                .attr("y", y + CONFIG.legend_width)
                .style("width", `${CONFIG.legend_width}px`)
                .style("height", `${CONFIG.legend_width}px`)
                .style("fill", CONFIG.null_color);
        svg_scale.append("text")
                .attr("x", CONFIG.legend_width + 5)
                .attr("y", y + 1.5 * CONFIG.legend_width + 5)
                .text("Sin datos");
      }