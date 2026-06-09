/*
 * Viewer-request rules for the /lmctl/* behavior:
 * - /lmctl/ rewrites to /lmctl/index.html; no redirect.
 * - Slashless extensionless paths rewrite to append .html.
 * - Trailing-slash paths other than /lmctl/ redirect 301 to slashless canonical.
 * - Requests whose last path segment has a file extension are left untouched.
 *
 * 404 handling is not implemented here. Viewer-request functions cannot know
 * whether the origin key exists.
 */
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri === '/lmctl' || uri === '/lmctl/') {
    request.uri = '/lmctl/index.html';
    return request;
  }

  if (uri.indexOf('/lmctl/') !== 0) {
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
