// set dimensions and margins of the graph
margin = ({top: 100, right: 120, bottom: 70, left: 220});

var width  = document.getElementById('viz').clientWidth;
var height = 100823;

// Declare variables here to take them out of the data.csv function
var dataByGame = [];
var minhrs = 1;
var maxhrs = 999999;

// Test function for printing each object
function printEach(row)
{
  console.log(row);
}
// Creates a tooltip to display name and data for each game
var tip = d3.tip()
  .attr("class","d3-tip")
	.offset([-5,0])
	.html(function (d){
	  properties = d.target.__data__;
		gameName = properties.Game;
		num = properties.NumPurchased;
		hrs = properties.HoursPlayed;
		total = properties.TotalHours;
		if (Math.round(hrs) >= 1)
			return `${gameName}</br>${Math.round(hrs)} average hours played</br>${num} purchased
      </br>${Math.round(total)} total hours played`;
    else
      return `${gameName}</br> < 1 average hours played</br>${num} purchased
      </br> < 1 total hours played`;
		});

// Logarithmic scale for coloring the bars 
var logScale = d3.scaleLog().domain([minhrs, maxhrs]);
var logColorScale = d3.scaleSequential(function(d){return d3.interpolateGreens(logScale(d));});
var seqColorScale = d3.scaleSequential(d3.interpolateGreens).domain([minhrs, maxhrs]);

// Create and append svg
const svg = d3.select("#vizArea")
              .append("svg")
              .attr("width", width)
              .attr("height", height);

// calling the tooltip
svg.call(tip);

// Get data
data = d3.csv("steam-200k-cleaned.csv")
         .then(function (data) {
            data.forEach(function (d) {
              d.HoursPlayed = +d.HoursPlayed;
            });
  // Filter data by average hours played and total copies purchased
  var holder = {};
  var count = {};
  var pCount = {};
  data.forEach(function(elem) {
    // Excludes all null elements
    if (elem.HoursPlayed != -1)
    {
      if (holder.hasOwnProperty(elem.Game))
      {
        holder[elem.Game] = holder[elem.Game] + elem.HoursPlayed;
        count[elem.Game] = count[elem.Game] + 1;
      }
      else
      {
        holder[elem.Game] = elem.HoursPlayed;
        count[elem.Game] = 1;
      }
    }

    if ((elem.Action).localeCompare("purchase"))
    {
      if (pCount.hasOwnProperty(elem.Game))
      {
        pCount[elem.Game] = pCount[elem.Game] + 1;
      }
      else
      {
        pCount[elem.Game] = 1;
      }
    }
  });

  for (var prop in holder)
  {
	  hrs = holder[prop];
    
    if(hrs > maxhrs)
    {
		  maxhrs = hrs;
    }
    
    dataByGame.push(
      {
        Game: prop, 
        NumPurchased: pCount[prop], 
        HoursPlayed: hrs / count[prop],
        TotalHours: hrs
      });
  }

  purchaseCount = dataByGame.sort((a, b) => b.NumPurchased - a.NumPurchased);

  // Test to make sure correct values are being printed
  // purchaseCount.forEach(printEach);
  // totalPlayed.forEach(printEach);
  // overallPlaytime.forEach(printEach);
  // console.log(purchaseCount.length);
  // console.log(dataByGame);

  updateGraph(dataByGame, 1);
});

// function uses the total hours and the logarithmic scale to get a green for the bar
function getBarColor(d)
{
  hrs = d.TotalHours;
	return logColorScale(hrs);
}

// Using ints (dataKey) to identify which dataset is being used for now. Probably a better way to do this.
// 0 is for average hours played dataset
// 1 is for total copies purchased dataset
// Function that actually draws the visualization after each change
function updateGraph(newData, dataKey)
{
  var maXvalue = null;
  if (dataKey == 0)
  {
    maXvalue = 1300;
  }
  else
  {
    maXvalue = 5000;
  }

  // set x and y axes
  var yAxis = d3.scaleBand()
                .range([0, (newData.length + 1) * 28])
                // Set paddingInner to change space between the bars
                .paddingInner(0.25)
                .domain(newData.map(function(d) 
                {
                  return (d.Game);
                }
                ));

  var xAxis = d3.scaleLinear()
                .range([margin.left, width - margin.right])
                .domain([0, maXvalue]);

  // appends background
  svg.append("rect")
     .attr("width", "100%")
     .attr("height", "100%")
     .style("fill", "#F5F5F2");

  // change header text
  if (dataKey == 0)
  {
    d3.select("h4").text("Games by Average Hours Played")
  }
  else 
  {
    d3.select("h4").text("Games by Total Copies Purchased")
  }

  // append x axis
  svg.append("g")
     .attr("class", "x axis")
     .attr("transform", "translate(" + 70 + ", " + 50 + ")")
     .call(d3.axisTop(xAxis).ticks(12))
     // Can increase the font size of the y-axis with this call, but some games have really long names
     .style("font-size", "14px");

  // append y axis
  svg.append("g")
     .attr("class", "y axis")
     .attr("transform", "translate(" + (margin.left + 70) + ", " + 50 + ")")
     .call(d3.axisLeft(yAxis))
       //truncate game titles — only effects y-axis text, full titles visible on tooltips
       .selectAll("text").text(function(t)
       {
         if(t.length > 32)
         {
           return(t.substring(0, 32) + "...");
         }
         else
         {
           return t;
         }
       })
     .style("font-size", "14px");

  // create the bars for bargraph
  svg.selectAll(".bar")
     .data(newData)
     .enter()
     .append("g")
     .append("rect")
     .attr("transform", "translate(" + (margin.left + 70) + ", " + 50 + ")")
     .attr("class", "bar")
     .attr("y", function(d) 
      {
        return (yAxis(d.Game));
      })
     .attr("height", yAxis.bandwidth())
     .attr("fill", getBarColor)
     .attr("x", 0)
     .attr("width", function(d) 
      {
        if (dataKey == 0)
        {
          // Set minimum bar size if the data is too small
          if ((xAxis(d.HoursPlayed) - margin.left) < 10)
          {
            return 10;
          }
          else
          {
            return xAxis(d.HoursPlayed) - margin.left;
          }
        }
        else
        {
          if ((xAxis(d.NumPurchased) - margin.left) < 10)
          {
            return 10;
          }
          else
          {
            return xAxis(d.NumPurchased) - margin.left;
          }
        }
        })
     .attr("stroke", "black")
     .on("mouseover",tip.show)
     .on("mouseout",tip.hide);
      
}

// Updates graph with different dataset
var displayingAvg = false;
function changeGraph()
{
  svg.selectAll("*").remove();
  if (displayingAvg)
  {
    updateGraph(dataByGame, 1);
    displayingAvg = false;
  }
  else
  {
    updateGraph(dataByGame, 0);
    displayingAvg = true;
  }
}

// sorts data highest to lowest
function sortHighest()
{
  svg.selectAll("*").remove();
  if (displayingAvg)
  {
	  dataByGame = dataByGame.sort((a,b) => b.HoursPlayed - a.HoursPlayed);
    updateGraph(dataByGame, 0);
  }
  else
  {
	  dataByGame = dataByGame.sort((a,b) => b.NumPurchased - a.NumPurchased);
    updateGraph(dataByGame, 1);
  }
}

// sorts data lowest to highest
function sortLowest()
{
  svg.selectAll("*").remove();
  if (displayingAvg)
  {
	  dataByGame = dataByGame.sort((a,b) => a.HoursPlayed - b.HoursPlayed);
    updateGraph(dataByGame, 0);
  }
  else
  {
    dataByGame = dataByGame.sort((a,b) => a.NumPurchased - b.NumPurchased);
    updateGraph(dataByGame, 1);
  }
}

// Sorts the data alphabetically from 'A'-'Z'. Not case sensitive.
function sortAlphabet()
{
  svg.selectAll("*").remove();
  dataByGame = dataByGame.sort(function(a, b)
  {
    var game1 = a.Game.toLowerCase();
    var game2 = b.Game.toLowerCase();
    if (game1 > game2)
    {
      return 1;
    }
    if (game2 > game1)
    {
      return -1;
    }
    else
    {
      return 0;
    }
  });

  if (displayingAvg)
  {
    updateGraph(dataByGame, 0);
  }
  else
  {
    updateGraph(dataByGame, 1);
  }
}

//end of file
