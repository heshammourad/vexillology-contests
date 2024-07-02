export function createTraces(points, groupDetails, plotDetails = {
  mode: 'markers', type: 'scatter',
}) {
  const initial = groupDetails.map((details) => ({
    x: [], y: [], text: [], hovertemplate: '%{text}', ...details, ...plotDetails,
  }));
  return points.reduce((traces, point) => {
    traces[point.group].x.push(point.x);
    traces[point.group].y.push(point.y);
    traces[point.group].text.push(point.text);
    return traces;
  }, initial);
}

export function roundTwoDecimals(num) {
  return Math.round(num * 100) / 100;
}

export function trimUsername(username, chars = 6) {
  return `${username.length < chars ? username : username.substring(0, chars)}...`;
}
