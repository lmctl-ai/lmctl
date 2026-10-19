// Viewer-request routing for the shared lmctl.com distribution.
// - Keep www.lmctl.com -> lmctl.com redirect first.
// - Rewrite /lmctl and /lmctl/ to /lmctl/index.html.
// - Rewrite /lmprobe and /lmprobe/ to /lmprobe/index.html.
// - Rewrite /internal/lmctl and /internal/lmctl/ to /internal/lmctl/index.html.
// - Rewrite /tools and /tools/ to /tools/index.html; /tools/<tool> (one
//   segment, no extension) to /tools/<tool>/index.html; deeper extensionless
//   /tools/* pages get .html; trailing slashes 301 to the slashless URL.
// - For /lmctl/* and /lmprobe/* static pages, redirect trailing slashes to
//   slashless canonical URLs and append .html to extensionless paths.
// - Leave root, /opendev/*, /internal/* non-root, assets, and extensioned
//   requests untouched.
function handler(event) {
  var request = event.request;
  var host = request.headers.host.value;
  if (host === 'www.lmctl.com') {
    return { statusCode: 301, statusDescription: 'Moved Permanently', headers: { location: { value: 'https://lmctl.com' + request.uri } } };
  }

  var uri = request.uri;

  if (uri === '/lmctl' || uri === '/lmctl/') {
    request.uri = '/lmctl/index.html';
    return request;
  }

  if (uri === '/lmprobe' || uri === '/lmprobe/') {
    request.uri = '/lmprobe/index.html';
    return request;
  }

  if (uri === '/internal/lmctl' || uri === '/internal/lmctl/') {
    request.uri = '/internal/lmctl/index.html';
    return request;
  }

  if (uri === '/tools' || uri === '/tools/') {
    request.uri = '/tools/index.html';
    return request;
  }

  if (uri.indexOf('/tools/') === 0) {
    var toolsLast = uri.substring(uri.lastIndexOf('/') + 1);
    if (toolsLast.indexOf('.') !== -1) {
      return request;
    }
    if (uri.charAt(uri.length - 1) === '/') {
      return {
        statusCode: 301,
        statusDescription: 'Moved Permanently',
        headers: { location: { value: uri.slice(0, -1) + queryString(request.querystring) } },
      };
    }
    // /tools/<tool> is a directory page; anything deeper is a .html page.
    request.uri = uri.split('/').length === 3 ? uri + '/index.html' : uri + '.html';
    return request;
  }

  var isCleanUrlPrefix = uri.indexOf('/lmctl/') === 0 || uri.indexOf('/lmprobe/') === 0;

  if (!isCleanUrlPrefix) {
    return request;
  }

  var lastSegment = uri.substring(uri.lastIndexOf('/') + 1);
  var hasExtension = lastSegment.indexOf('.') !== -1;

  if (!hasExtension && uri.charAt(uri.length - 1) === '/') {
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: {
        location: {
          value: uri.slice(0, -1) + queryString(request.querystring),
        },
      },
    };
  }

  if (!hasExtension) {
    request.uri = uri + '.html';
  }

  return request;
}

function queryString(querystring) {
  var parts = [];

  for (var key in querystring) {
    if (!Object.prototype.hasOwnProperty.call(querystring, key)) {
      continue;
    }

    var item = querystring[key];

    if (item.multiValue) {
      for (var i = 0; i < item.multiValue.length; i++) {
        parts.push(key + '=' + item.multiValue[i].value);
      }
    } else if (item.value === '') {
      parts.push(key);
    } else {
      parts.push(key + '=' + item.value);
    }
  }

  return parts.length ? '?' + parts.join('&') : '';
}
