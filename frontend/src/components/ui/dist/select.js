"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
exports.__esModule = true;
exports.SelectScrollDownButton = exports.SelectScrollUpButton = exports.SelectSeparator = exports.SelectItem = exports.SelectLabel = exports.SelectContent = exports.SelectTrigger = exports.SelectValue = exports.SelectGroup = exports.Select = void 0;
var React = require("react");
var SelectPrimitive = require("@radix-ui/react-select");
var lucide_react_1 = require("lucide-react");
var utils_1 = require("../../lib/utils");
var Select = SelectPrimitive.Root;
exports.Select = Select;
var SelectGroup = SelectPrimitive.Group;
exports.SelectGroup = SelectGroup;
var SelectValue = SelectPrimitive.Value;
exports.SelectValue = SelectValue;
var SelectTrigger = React.forwardRef(function (_a, ref) {
    var className = _a.className, children = _a.children, props = __rest(_a, ["className", "children"]);
    return (React.createElement(SelectPrimitive.Trigger, __assign({ ref: ref, className: utils_1.cn("flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1", className) }, props),
        children,
        React.createElement(SelectPrimitive.Icon, { asChild: true },
            React.createElement(lucide_react_1.ChevronDown, { className: "h-4 w-4 opacity-50" }))));
});
exports.SelectTrigger = SelectTrigger;
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;
var SelectScrollUpButton = React.forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (React.createElement(SelectPrimitive.ScrollUpButton, __assign({ ref: ref, className: utils_1.cn("flex cursor-default items-center justify-center py-1", className) }, props),
        React.createElement(lucide_react_1.ChevronUp, { className: "h-4 w-4" })));
});
exports.SelectScrollUpButton = SelectScrollUpButton;
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;
var SelectScrollDownButton = React.forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (React.createElement(SelectPrimitive.ScrollDownButton, __assign({ ref: ref, className: utils_1.cn("flex cursor-default items-center justify-center py-1", className) }, props),
        React.createElement(lucide_react_1.ChevronDown, { className: "h-4 w-4" })));
});
exports.SelectScrollDownButton = SelectScrollDownButton;
SelectScrollDownButton.displayName =
    SelectPrimitive.ScrollDownButton.displayName;
var SelectContent = React.forwardRef(function (_a, ref) {
    var className = _a.className, children = _a.children, _b = _a.position, position = _b === void 0 ? "popper" : _b, props = __rest(_a, ["className", "children", "position"]);
    return (React.createElement(SelectPrimitive.Portal, null,
        React.createElement(SelectPrimitive.Content, __assign({ ref: ref, className: utils_1.cn("relative z-50 max-h-[--radix-select-content-available-height] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-select-content-transform-origin]", position === "popper" &&
                "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1", className), position: position }, props),
            React.createElement(SelectScrollUpButton, null),
            React.createElement(SelectPrimitive.Viewport, { className: utils_1.cn("p-1", position === "popper" &&
                    "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]") }, children),
            React.createElement(SelectScrollDownButton, null))));
});
exports.SelectContent = SelectContent;
SelectContent.displayName = SelectPrimitive.Content.displayName;
var SelectLabel = React.forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (React.createElement(SelectPrimitive.Label, __assign({ ref: ref, className: utils_1.cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className) }, props)));
});
exports.SelectLabel = SelectLabel;
SelectLabel.displayName = SelectPrimitive.Label.displayName;
var SelectItem = React.forwardRef(function (_a, ref) {
    var className = _a.className, children = _a.children, props = __rest(_a, ["className", "children"]);
    return (React.createElement(SelectPrimitive.Item, __assign({ ref: ref, className: utils_1.cn("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className) }, props),
        React.createElement("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center" },
            React.createElement(SelectPrimitive.ItemIndicator, null,
                React.createElement(lucide_react_1.Check, { className: "h-4 w-4" }))),
        React.createElement(SelectPrimitive.ItemText, null, children)));
});
exports.SelectItem = SelectItem;
SelectItem.displayName = SelectPrimitive.Item.displayName;
var SelectSeparator = React.forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (React.createElement(SelectPrimitive.Separator, __assign({ ref: ref, className: utils_1.cn("-mx-1 my-1 h-px bg-muted", className) }, props)));
});
exports.SelectSeparator = SelectSeparator;
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;
