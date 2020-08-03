export const DWMacrosConfig = {};

DWMacrosConfig.template = "modules/dwmacros/templates/chat/common-dialog.html";

DWMacrosConfig.dialogTypes = {
    normal: "",
    damage: "damage",
    success: "success",
    fail: "fail",
    partial: "partial"
}

DWMacrosConfig.dialogClasses = {
    damage: "dieDamage",
    success: "dieSuccess",
    fail: "dieFail",
    partial: "diePartial"
}