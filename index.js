// builtin
var fs = require('fs');
var path = require('path');

// return true if the dependency is not pinned
function is_floating(dep) {
    // exact N.N.N
    if (/^\d+.\d+.\d+/.test(dep)) {
        return false;
    }

    //longform git url with trailing commit id or tag
    if (/^git:\/\/(.*)#(.+)$/.test(dep)) {
        return false;
    }

    // finally, shortform github user/repo#hash
    if (/^[\w-]+\/[\w-.]+#(.+)$/.test(dep)) {
        return false;
    }

    return true;
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
        if (is_floating(dep)) {
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

