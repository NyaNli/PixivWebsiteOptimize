!function(){
    var inject = function() {
        var loadlist = [];
        var loadable = [];
        var maxcount = 8;
        var retrydelay = 1000;

        var _attr = Image.prototype.setAttribute;
        Image.prototype.setAttribute = function(a, v) {
            if (a == 'src') {
                var self = this;
                if (v == '') {
                    self.src = '';
                    if (loadable.includes(self))
                        loadable.splice(loadable.indexOf(self), 1);
                    if (loadlist.includes(self))
                        loadlist.splice(loadlist.indexOf(self), 1);
                    update();
                    return;
                }
                self.slowload = v;
                loadlist.push(self);
                self.style.opacity = '0';
                self.addEventListener('load', function(){
                    if (loadable.includes(self))
                        loadable.splice(loadable.indexOf(self), 1);
                    update();
                });
                update();
                return;
            } else if (a == 'srcSet') return;
            _attr.call(this, a, v);
        };

        var _addEV = Image.prototype.addEventListener
        Image.prototype.addEventListener = function() {
            if (arguments[0] == 'error') {
                var self = this;
                if (!self.autoReload) {
                    _addEV.call(self, 'error', function(e){
                        if (loadable.includes(self) && self.parentNode)
                            setTimeout(function(){
                                self.src = '';
                                self.src = self.slowload;
                            }, retrydelay);
                        else
                            for (var i in self.errorListeners)
                                self.errorListeners[i].call(this, e);
                    });
                    self.autoReload = 1;
                    self.errorListeners = [];
                }
                this.errorListeners.push(arguments[1]);
                return;
            }
            _addEV.apply(this, arguments);
        }

        var update = function() {
            while (loadable.length < maxcount && loadlist.length > 0) {
                var img = loadlist.shift();
                loadable.push(img);
                img.src = img.slowload;
                img.style.opacity = '';
            }
        }

        var clear = function() {
            loadlist = [];
            while (loadable.length > 0) {
                var img = loadable.shift();
                img.src = '';
            }
        }

        if (window.history) {
            var _push = window.history.pushState;
            window.history.pushState = function() {
                clear();
                return _push.apply(this, arguments);
            }
            var _replace = window.history.replaceState;
            window.history.replaceState = function() {
                clear();
                return _replace.apply(this, arguments);
            }
        }
    };
    var s = document.createElement('script');
    s.type = 'text/javascript';
    s.innerHTML = '(' + inject.toString() + '());';
    document.documentElement.appendChild(s);
}();
