---
title: One Month of Sydney Metro
head: |
  <meta name="description" content="Calculate and understand the tax cut you will receive from Stage 3 Tax Cuts" />
---

```tsx
import { sydneymetroArticle } from "../article-manifest.js";
import { Prelude } from "../components/prelude.js";
display(<Prelude article={sydneymetroArticle}/>)
```

```js
import * as vgplot from "npm:@uwdata/vgplot";
const date = new Date(`${observable.params.year}-${observable.params.month}-${observable.params.day}T00:00:00Z`);

const geojson = await (FileAttachment('../data/metroLineGeo.json').json())
const station_geojson = await (FileAttachment('../data/stationGeo.json').json());

const db = await DuckDBClient.of({
    data: FileAttachment(`../data/roam-metro-${observable.params.year}-${observable.params.month}-${observable.params.day}.parquet`),
    stationDistances: FileAttachment('../data/stationDistances.json'),
})
const sql = db.sql.bind(db);
const coordinator = new vgplot.Coordinator();
const vg = vgplot.createAPIContext({ coordinator });
coordinator.databaseConnector(vgplot.wasmConnector({ duckdb: db._db }));

const tripsView = await db.sql`
CREATE OR REPLACE VIEW trips AS WITH DepartureTimes AS (
    SELECT 
        NEW_TRIP_NAME,
        MIN(COALESCE(ACT_STN_ARRV_TIME, PLN_STN_ARRV_TIME, ACT_STN_ARRV_TIME)) AS departure_time,
    FROM data
    WHERE card_type = 'All card types'
    GROUP BY NEW_TRIP_NAME
)
SELECT 
    d.ACT_STOP_STN as station, 
    d.SEGMENT_DIRECTION as direction,
    d.NODE_SEQ_ORDER as seq,
    d.NEW_TRIP_NAME as trip_name,
    (d.min_occupancy) as occupancy,
    ROW_NUMBER() OVER () as trip_id,
    COALESCE(d.ACT_STN_ARRV_TIME, d.PLN_STN_ARRV_TIME, d.ACT_STN_DPRT_TIME) as arrival_time,
    COALESCE(d.ACT_STN_DPRT_TIME, d.PLN_STN_DPRT_TIME, d.ACT_STN_ARRV_TIME) as departure_time,
    ROUND(
        EXTRACT(EPOCH FROM (COALESCE(d.ACT_STN_ARRV_TIME, d.PLN_STN_ARRV_TIME) - dt.departure_time)) / 60
    ) AS minutes_since_departure
FROM 
    data d
JOIN 
    DepartureTimes dt
ON 
    d.NEW_TRIP_NAME = dt.NEW_TRIP_NAME
WHERE 
    d.card_type = 'All card types'
ORDER BY
    d.NEW_TRIP_NAME, d.NODE_SEQ_ORDER;`;
const trips = await db.sql`SELECT * FROM trips`;
const tripsWithDistancesView = await db.sql`CREATE OR REPLACE VIEW tripsWithDistances AS (
    SELECT * 
    FROM 
        trips t
    JOIN
        stationDistances s ON t.station = s.station
)
`;
```

On 19 August 2024, Sydney Metro reached a signficant milestone with
the launch of its expanded network through the heart of the city.
The new Sydney Metro City section extends the existing line from Chatswood, through the CBD, and down to Sydenham.

Using data from Transport for NSW, we explore the train movements,
commuter patterns, and activity across the newly expanded network.

This page includes interactive visualisations that allow you to explore the
data at your own pace.

<div id="visualization"></div>

## Stations
There are 21 stations on the Sydney Metro network, spanning from **Sydenham** in the south to **Tallawong** in the north-west.

The line chart below shows the **cumulative track distance** between each station, starting from **Sydenham**.
A bar chart is overlaid to show the **difference** between the track distance and the crow fly distance between each station.

<div style="position: relative">

<div>

```sql id=stationPairs
WITH StationPairs AS (
    SELECT 
        s1.station AS "From",
        s2.station AS "To",
        (s1.trackDistance - s2.trackDistance) / 1000.0 AS TrackDistance,
        (s1.crowFlyDistance - s2.crowFlyDistance) / 1000.0 AS CrowFlyDistance
    FROM 
        stationDistances s1
    JOIN 
        stationDistances s2 ON s1.id = s2.id - 1
)
SELECT 
    "From",
    "To",
    TrackDistance AS distance,
    'Track Distance' AS "type"
FROM 
    StationPairs
UNION ALL
SELECT 
    "From",
    "To",
    CrowFlyDistance AS distance,
    'As The Crow Flies' AS "type"
FROM 
    StationPairs
```

```sql id=normalisedStationDistances
SELECT
    station,
    trackDistance / 1000.0 as distance,
    'Track Distance' as "type"
FROM
    stationDistances
UNION ALL
SELECT
    station,
    crowFlyDistance / 1000.0 as distance,
    'As The Crow Flies' as "type"
FROM
    stationDistances
```

```js
const stations = (await db.sql`SELECT station FROM stationDistances`).toArray().map(d => d.station);
```


```js
const text = [
    {
        station: "North Ryde",
        text: "From Chatswood to North Ryde, the metro travels 2.5km longer than the straight-line distance between the two stations"
    }
];

const distancePlot = Plot.plot({
    marginBottom: 60,
    grid: true,
    x: {
        domain: stations,
        reverse: true,
        tickRotate: 20,
    },
    y: {
        label: "Distance (km)",
    },
    color: {
        legend: true,
        domain: ['Track Distance', 'As The Crow Flies'],
    },
    marks: [
        Plot.line(normalisedStationDistances, {
            x: "station",
            y: "distance",
            stroke: "type",
        }),
        Plot.tip(
            text,
            {x: "station", title: "text", anchor: "bottom-right", y: 23, dx: -10}
        ),
        Plot.rectY(stationPairs, {
            x1: "From",
            x2: "To",
            y1: () => 0,
            y2: "distance",
            fill: "type",
            inset: 0.5,
            tip: true,
            title: (d) => `${d.From} to ${d.To}\nDistance: ${d.distance} km\nType: ${d.type}`,
        }),
    ]
})
const hoveredDistance = view(distancePlot);
```
</div>

<div style="position: absolute; top: 0; left: -500px">

```js
Plot.plot({
    width: 500,
    height: 400,
    projection: {
    type: "mercator",
    rotate: [-133, 27],
    domain: geojson,
    inset: 20,
},
    marks: [
        Plot.geo(geojson, {
            stroke: "#168388",
            strokeWidth: 3,
        }),
        Plot.geo(station_geojson,
            {
                r: 5,
                stroke: (d) => hoveredDistance && (hoveredDistance.From === d.properties.name || hoveredDistance.To === d.properties.name)
                    ? "orange"
                    : "#168388",
                strokeWidth: 4,
                fill: 'white',
                tip: true,
                title: (d) => d.properties.name,
            }
        ),
        Plot.text(station_geojson, {
            text: (d) => d.properties.name,
            x: (d) => d.geometry.coordinates[0],
            y: (d) => d.geometry.coordinates[1],
            dx: 12,
            dy: 0,
            fontSize: 10,
            textAnchor: "start",
            baseline: "middle",
            filter: (d, i) => i % 2 === 0,
        }),
    ]
})
```
</div>
</div>

## Services

<div class="grid grid-cols-2">
<div>

This [Marey chart]() shows the movement of metro trains on **${d3.utcFormat('%A, %d %B %Y')(date)}**.
There are **${trip_count}** services in total.

Each diagonal line on the chart represents a particular service. 
The x-axis shows the stations from **Sydenham** to **Tallawong**, and the y-axis shows time.

On a typical weekday, five distinct bands are visible on the chart.
These bands correspond to the frequency of services during the day:
[early morning](#), [morning peak](#), [midday](#), [afternoon peak](#) and [evening](#).

### Speed

Stations are spaced proportionally to the **track distance** between them.

Therefore, the **slope** of a line encodes the average speed of the train between stations.
A flatter slope indicates a faster train (since it covers more distance in the same time),
while a steeper slope indicates a slower train.


### Punctuality

It typically takes 60 minutes to travel from one end of the line to the other.
To see how a specific service compares to the others, hover over a specific line on the Marey chart.

```js
const test = tripsWithDistancesView
view(vg.plot(
    vg.ruleX(
        vg.from("stationDistances"),
        {
            x: 'trackDistance',
            strokeOpacity: 0.2,
            strokeDasharray: 2,
        }
    ),
    vg.text(
        vg.from("stationDistances"),
        {
            x: vg.min("trackDistance"),
            text: "station",
            y: 61,
            dy: 20,
            rotate: 15,
            textAnchor: 'start',
            fontSize: 10,
        }
    ),
    vg.line(
        vg.from("tripsWithDistances", {filterBy: $filter}),
        {
            x: "trackDistance",
            y: "minutes_since_departure",
            z: "trip_name",
            marker: 'circle',
            stroke: 'white',
        }
    ),
    vg.highlight({
        by: $tripSelection,
        stroke: 'red',
    }),
    vg.xLabel(null),
    vg.xAxis(false),
    vg.yReverse(true),
    vg.yLabel("minutes since departure"),
))
```

We can 

</div>
<div>

```js
// const speedUpFactor = 10;
// const time = (async function* () {
//   for (let j = 10800; true; j += speedUpFactor) {
//     if (j >= 86400) {
//         j = 0;
//     }
//     yield d3.utcSecond.offset(date, j + 10800)
//     await new Promise((resolve) => setTimeout(resolve, 8));
//   }
// })();
```

```js
const $tripSelection = vg.Selection.crossfilter();
```

```js
const test = tripsWithDistancesView
view(
    vg.vconcat(
    vg.colorLegend({for: 'map', as: $filter, field: 'occupancy'}),
    vg.plot(
        vg.name('map'),
        vg.ruleX(
            vg.from("tripsWithDistances"),
            {
                x: `trackDistance`,
                strokeOpacity: 0.2,
                strokeDasharray: 2,
            }
        ),
        vg.text(
            vg.from("tripsWithDistances"),
            {
                x: vg.min("trackDistance"),
                text: "station",
                dy: 390,
                rotate: 15,
                textAnchor: 'start',
                fontSize: 10,
            }
        ),
        vg.line(
            vg.from("tripsWithDistances", {filterBy: $filter}),
            {
                x: "trackDistance",
                y: "arrival_time",
                z: "trip_name",
                marker: 'circle',
                stroke: 'occupancy',
                tip: true,
                // title: (d) => `${d.station}\n${ d3.utcFormat("%I:%M %p")(d.arrival_time) }\nEst. Min Occupancy: ${d.occupancy}`,
            }
        ),
        // vg.yDomain([earliest_departure, latest_arrival]),
        vg.colorScheme("plasma"),
        vg.colorZero(true),
        vg.colorDomain([0,1199]),
        vg.colorN(5),
        vg.height(800),
        vg.yReverse(true),
        vg.yTickFormat(d3.utcFormat("%I:%M %p")),
        vg.xAxis(false),
    )
    )
)

view(
    vg.menu({
        as: $filter,
        column: "Direction",
        value: "Up",
        options: [
            { label: "Tallawong to Sydenham", value: "Up" },
            { label: "Sydenham to Tallawong", value: "Down" },
        ]
    })
)
```

```js
display(directionInput);
display(colorInput);

// const plot = view(Plot.plot({
//     marginLeft: 60,
//     marginBottom: 60,
//     height: 800,
//     marginRight: 60,
//     x: {
//         label: null,
//         axis: null,
//         transform: (d) => distances[stations.indexOf(d)],
//         tickRotate: 45,
//     },
//     y: {
//         label: null,
//         tickFormat: d3.utcFormat("%I:%M %p"),
//         reverse: true,
//         // domain: selectedFilter ? selectedFilter : [earliest_departure, latest_arrival],
//     },
//     color: {
//         legend: true,
//         scheme: 'plasma',
//     },
//     marks: [
//         Plot.ruleX(trips, Plot.groupX({}, {x: "station", strokeOpacity: 0.2, strokeDasharray: 2, })),
//         Plot.line(trips, {
//             filter: (d) => {
//                 const directionFilter = direction ? d.direction === direction : true;
//                 const timeFilter = selectedFilter ? d.arrival_time >= selectedFilter[0] && d.arrival_time <= selectedFilter[1] : true;

//                 return directionFilter && timeFilter;
//             },

//             fx: (d) => !direction ? d.direction : undefined,
//             x: 'station',
//             y: 'arrival_time',
//             z: 'trip_name',
//             marker: 'circle',
//             tip: true,
//             stroke: 'occupancy',
//             title: (d) => `${d.station}\n${ d3.utcFormat("%I:%M %p")(d.arrival_time) }\nEst. Min Occupancy: ${d.occupancy}`,
//         }),
//         Plot.text(trips, Plot.groupX({text: 'first', y: "min"}, {
//             x: 'station',
//             filter: (d) => stations.indexOf(d.station) % 3 === 0 || d.station === 'Sydenham',
//             y: () => selectedFilter ? selectedFilter[1] : latest_arrival,
//             textAnchor: 'start',
//             dy: 10,
//             rotate: 15,
//             text: 'station', 
//         })),
//     ]
// }));
```

```js
const test = tripsWithDistancesView
const histogram2 = vg.plot(
    vg.rectY(vg.from("tripsWithDistances"), {x: vg.bin("arrival_time"), y: vg.sum("occupancy"), insetLeft: 0.5, insetRight: 0.5}),
    vg.intervalX({as: $filter}),
    vg.xScale("utc"),
    vg.yTickFormat("s"),
    vg.xLabel(null),
    vg.yLabel(null),
    vg.yTicks(0),
    vg.height(100)
);
display(histogram2);
```

</div>
</div>


```js
display(Inputs.table(trips))
```

```js
function insertNode(node, interval) {
    if (!node) {
        return {...interval, left: null, right: null, max: interval.end};
    }
    if (interval.start < node.start) {
        node.left = insertNode(node.left, interval);
    } else {
        node.right = insertNode(node.right, interval);
    }

    node.max = Math.max(node.max, interval.end);
    return node;
}

function buildTree() {
    const intervals = []
    const tripsArr = trips.toArray();
    // Create a map of stations and int 
    const stationMap = new Map();
    for (let i = 0; i < stations.length; i++) {
        stationMap.set(stations[i], i);
    }


    for (let i = 0; i < tripsArr.length - 1; i++) {
        const trip = tripsArr[i];
        const next = tripsArr[i+1];

        intervals.push({
            start: trip.arrival_time,
            end: trip.departure_time,
            station: stationMap.get(trip.station),
            trip_name: trip.trip_name,
            direction: trip.direction,
            occupancy: trip.occupancy,
        });

        if (next && next.trip_name == trip.trip_name) {
            intervals.push({
                start: trip.departure_time,
                end: next.arrival_time,
                fromStation: stationMap.get(trip.station),
                toStation: stationMap.get(next.station),
                direction: trip.direction,
                trip_name: trip.trip_name,
                occupancy: next.occupancy,
            });
        }
    }

    const last = tripsArr[tripsArr.length - 1];
    intervals.push({
        start: last.arrival_time,
        end: last.departure_time,
        station: last.station,
        trip_name: last.trip_name,
        direction: last.direction,
        occupancy: last.occupancy,
    });

    // randomly shuffle the intervals
    const shuffled = _.shuffle(intervals);
    let root;
    for (const interval of shuffled) {
        root = insertNode(root, interval);
    }
    return root;
}
function getDepth(node) {
    if (!node) {
        return 0;
    }
    return 1 + Math.max(getDepth(node.left), getDepth(node.right));
}   

function query(node, time, result = []) {
    if (!node) return result;

    if (time >= node.start && time <= node.end) {
        if (node.station == null) {
            const { fromStation, toStation, start, end } = node;
            const fracIndex = start === end ? 1 : (time - start) / (end - start);
            result.push({...node, fracIndex});
        } else {
            result.push(node);
        }
    }

    if (node.left && node.left.max >= time) {
        query(node.left, time, result);
    }

    if (node.right && node.start <= time) {
        query(node.right, time, result);
    }
}

const queryTree = (time) => {
    const result = [];
    query(root, time, result);
    return result;
}

const root = buildTree();
```

```js
function interpolate(node) {
    if (node.station != null) {
        return (distances[0] - distances[node.station])/ distances[0] * svgWidth;
    }
    const { fromStation, toStation, fracIndex } = node;

    return (distances[0] - (distances[fromStation] + (distances[toStation] - distances[fromStation]) * fracIndex))/ distances[0] * svgWidth;
}
```


```js
const currentTrains = queryTree(time)
// display(data.stations)
// Remove existing trains
g.selectAll(".train").remove();
for (const train of currentTrains) {
    const yOffset = train.direction === 'Up' ? -20 : 20;
    const colorFromStation = train.station != null ? "#168388" : "#888";
    // instead of viridis use green to red
    const colorFromOccupancy = train.occupancy != null ? d3.interpolateRdYlGn(1- (train.occupancy / 600)) : "#888";
    const x = interpolate(train);
    const trainCircle = g.append("circle")
        .attr("class", "train")
        .attr("r", 4)
        .attr("fill", colorFromOccupancy)
        .attr("cx", x)
        .attr("cy", (svgHeight/2) + yOffset)
    
    // // on hover show a tooltip with the occupancy
    // trainCircle.on('mouseover', (event) => {
    //     const [x, y] = d3.pointer(event);
    //     const tooltip = g.append("g")
    //         .attr("class", "tooltip")
    //         .attr("transform", `translate(${x}, ${y})`);
    //         .append("text")
    //         .attr("x", 5)
    //         .attr("y", 15)
    //         .text(`Occupancy: ${train.occupancy}`);
    // }).on('mouseout', () => {
    //     g.select(".tooltip").remove();
    // });
}

timeDisplay.text(d3.utcFormat("%d %B, %I:%M:%S %p")(time));
```



```js
display(
    Plot.plot({
        width: width,
        marks: [
            Plot.frame(),
            Plot.line(_.sortBy(trips.toArray(), d => d.arrival_time), {
                x: "arrival_time",
                y: "occupancy",
                z: (d) => stations.indexOf(d.station),
                sort: {
                    fy: 'z',
                },
                fx: "direction",
                fy: "station",
            })
        ]
    })
)
```

```js
// Set up dimensions
const svgWidth = width;
const svgHeight = 150;

// Parse the date/time
const parseTime = d3.utcParse("%Y-%m-%dT%H:%M:%SZ");

const data = {
    "stations": stations.map((station, index) => ({
        name: station,
        // scale to distances
        x: ((distances[0] - distances[index]) / distances[0]) * svgWidth,
        // x: (index + 1) * (svgWidth / (stations.length + 1)),
        y: svgHeight / 2
    })),
};

// Set up SVG canvas
// Remove existing SVG if it exists
d3.select("#visualization").selectAll("svg").remove();
const svg = d3.select("#visualization").append("svg")
    .attr("width", svgWidth+100)
    .attr("height", svgHeight);

const g = svg.append("g")
    .attr("width", svgWidth)
    .attr("height", svgHeight)
    .attr("transform", "translate(20, 0)");

// tick marks
g.selectAll(".tick")
    .data(data.stations)
    .enter().append("line")
    .attr("class", "tick")
    .attr("x1", d => d.x)
    .attr("x2", d => d.x)
    .attr("y1", d => d.y + 10)
    .attr("y2", d => d.y + 20)
    .attr("stroke", "white")
    .attr("stroke-width", 1);

g.selectAll(".station-line")
    .data(data.stations.slice(0, -1))
    .enter().append("line")
    .attr("class", "station-line")
    .attr("x1", (d, i) => d.x)
    .attr("x2", (d, i) => data.stations[i+1].x)
    .attr("y1", d => d.y)
    .attr("y2", d => d.y)
    .attr("stroke", "#168388")
    .attr("stroke-width", 5);


// Add station circles
g.selectAll(".station")
    .data(data.stations)
    .enter().append("circle")
    .attr("class", "station")
    .attr("stroke", "#168388")
    .attr("stroke-width", 5)
    .attr("fill", "white")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", 10);



g.selectAll(".station-label")
    .data(data.stations)
    .enter().append("text")
    .attr("x", d => d.x)
    .attr("y", d => d.y + 30)
    .attr("text-anchor", "start")
    .attr("font-size", "0.5em")
    .attr("transform", d => `rotate(15, ${d.x}, ${d.y + 0})`)
    .attr("font-family", "sans-serif")
    .attr("fill", "currentColor")
    .text(d => d.name);


// Add a text element for displaying the current time
const timeDisplay = svg.append("text")
    .attr("x", 10)
    .attr("y", 20)
    .attr("font-size", "16px")
    .attr("fill", "white");
```

```sql id="[{trip_count, earliest_departure, latest_arrival}]"
SELECT 
    COUNT(DISTINCT NEW_TRIP_NAME) as trip_count,
    MIN(ACT_STN_DPRT_TIME) AS earliest_departure,
    MAX(ACT_STN_ARRV_TIME) AS latest_arrival
FROM data 
```

```sql id=lateTrips
SELECT ACT_STN_ARRV_TIME, PLN_STN_ARRV_TIME, ACT_STOP_STN
FROM 
    data
WHERE 
    card_type = 'All card types'
    AND (ACT_STN_ARRV_TIME - PLN_STN_ARRV_TIME) >= INTERVAL 1 minutes * CAST(1 AS INTEGER)
```

```sql
CREATE OR REPLACE VIEW tripss AS
WITH DepartureTimes AS (
    SELECT 
        NEW_TRIP_NAME,
        MIN(COALESCE(ACT_STN_ARRV_TIME, PLN_STN_ARRV_TIME)) AS departure_time
    FROM data
    WHERE card_type = 'All card types'
    GROUP BY NEW_TRIP_NAME
)
SELECT 
    d.ACT_STOP_STN as station, 
    d.SEGMENT_DIRECTION as direction,
    d.NODE_SEQ_ORDER as seq,
    d.NEW_TRIP_NAME as trip_name,
    COALESCE(d.ACT_STN_ARRV_TIME, d.PLN_STN_ARRV_TIME) as arrival_time,
    d.min_occupancy as occupancy,
    ROUND(
        EXTRACT(EPOCH FROM -(COALESCE(d.ACT_STN_ARRV_TIME, d.PLN_STN_ARRV_TIME) - dt.departure_time)) / 60
    ) AS minutes_since_departure
FROM 
    data d
JOIN 
    DepartureTimes dt
ON 
    d.NEW_TRIP_NAME = dt.NEW_TRIP_NAME
WHERE 
    d.card_type = 'All card types'
ORDER BY
    d.NEW_TRIP_NAME, d.NODE_SEQ_ORDER;
```

```js
```

```js
const directionInput = Inputs.select(new Map([
    ['Both', ''],
    ['Tallawong to Sydenham', 'Up'],
    ['Sydenham to Tallawong', 'Down'],
]), { label: 'Direction', value: '' });
const direction = Generators.input(directionInput);
```

```js
const colorInput = Inputs.select(['Occupancy', 'Speed'], { label: 'Color By', value: 'occupancy' });
const color = Generators.input(colorInput);
```



```js
const stationMap = Plot.plot({
  width: width,
  x: {
    type: "point",
    domain: stations,
    label: null,
    tickRotate: 20,
  },
  y: {
    ticks: 0,
  },
  marks: [
    Plot.line(
      stations.map((station, index) => ({ station, index })),
      {
        x: "station",
        y: 0,
        stroke: '#168388',
        strokeWidth: 5
      }
    ),
    Plot.dot(
        stations.map((station, index) => ({ station, index })),
        {
            filter: (d) => d.station === selectedStation,
            x: "station",
            r: 15,
            stroke: 'red',
        }
    ),
    Plot.dot(
      stations.map((station, index) => ({ station, index })),
      {
        x: "station",
        title: "station",
        r: 8,
        stroke: '#168388',
        strokeWidth: 5,
        fill: 'white',
        render: (index, scales, values, dimensions, context, next) => {
            const g = next(index, scales, values, dimensions, context);
            const children = d3.select(g).selectChildren();

            children.on('click', (event, i) => {
                setSelectedStation(values.channels.x.value[i]);
            })
            return g;
        }
      }
    ),
  ],
  height: 100,
  marginTop: 10,
  marginBottom: 70,
});

display(stationMap)
```


```js
// Create a shared filter
const $filter = vg.Selection.crossfilter();
const $colorFilter = vg.Selection.intersect();
```



```js
// Create the histogram
const histogram = vg.plot(
  vg.rectY(vg.from("tripss"), {x: vg.bin("arrival_time"), y: vg.count("trip_name"), insetLeft: 0.5, insetRight: 0.5}),
  vg.intervalX({as: $filter}),
  vg.xScale("utc"),
  vg.yTickFormat("s"),
  vg.xLabel(null),
  vg.yLabel(null),
  vg.yTicks(0),
  vg.height(100)
);
```

```js
```


```js
```

```js
const delayThreshold = Inputs.number({
    label: 'Delay Threshold (minutes)', 
    value: 1,
    step: 1,
    min: 1,
    max: 15,
});

display(delayThreshold);
```

```js
const selectedStation = Mutable(null);
const setSelectedStation = x => selectedStation.value = x;