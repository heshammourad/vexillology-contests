export function createTraces(trace, groupDetails, traceDetails = {
  mode: 'markers', type: 'scatter', text: [], hovertemplate: '%{text}',
}) {
  const initial = groupDetails.map((details) => ({
    x: [], y: [], ...details, ...traceDetails,
  }));
  return trace.reduce((traces, t) => {
    traces[t.group].x.push(t.x);
    traces[t.group].y.push(t.y);
    if (traceDetails.hovertemplate) { traces[t.group].text.push(t.text); }
    return traces;
  }, initial);
}

export function roundTwoDecimals(num) {
  return Math.round(num * 100) / 100;
}

export function trimUsername(username, chars = 6) {
  return `${username.length < chars ? username : username.substring(0, chars)}...`;
}
