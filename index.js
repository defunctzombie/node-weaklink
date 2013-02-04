// builtin
var fs = require('fs');
var path = require('path');

// return 'pinned' | 'unknown' | 'floating'
function dep_type(dep) {

    // ~N.N.N are considered unknown and still pose a problem
    if (/^~\d+.\d+.\d+/.test(dep)) {
        return 'unknown';
    }

    // exact N.N.N
    if (/^\d+.\d+.\d+/.test(dep)) {
        return 'pinned';
    }

    // longform git url with trailing commit id or tag
    if (/^git:\/\/(.*)#(.+)$/.test(dep)) {
        return 'unknown';
    }

    // longform git url with no trailing commit
    if (/^git:\/\/(.*)#(.+)$/.test(dep)) {
        return 'floating';
    }

    // shortform github user/repo#hash
    if (/^[\w-]+\/[\w-.]+#(.+)$/.test(dep)) {
        return 'unknown';
    }

    return 'floating';
}

function check_path(proj_path) {
    if (!fs.existsSync(proj_path)) {
        return {};
    }

    var pkg_path = path.join(proj_path, 'package.json');

    var pkg_info = JSON.parse(fs.readFileSync(pkg_path));
    var prj_name = pkg_info.name;

    // array of deps
    var dependencies = [];

    var contains_floating = false;

    var deps = pkg_info.dependencies || {};
    Object.keys(deps).forEach(function(name) {
        var dep = deps[name];

        var next = path.join(proj_path, 'node_modules', name);
        var res = check_path(next);

        // override version
        res.version = dep;
        res.name = name;
        res.deps = res.deps || [];

        dependencies.push(res);
        var type = dep_type(dep);
        res.type = type;
        if (type !== 'pinned') {
            res.is_floating = true;
            contains_floating = true;
        }

        contains_floating = contains_floating || res.contains_floating;
    });

    return {
        name: pkg_info.name,
        version: pkg_info.version,
        deps: dependencies,
        contains_floating: contains_floating
    }
}

module.exports = check_path;

