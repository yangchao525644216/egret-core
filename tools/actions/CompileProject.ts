/// <reference path="../lib/types.d.ts" />

import utils = require('../lib/utils');
import Compiler = require('./Compiler');
import FileUtil = require('../lib/FileUtil');
import exmlActions = require('../actions/exml');
import LoadConfig = require('./LoadConfig');

class CompileProject {
    compile(options: egret.ToolArgs) {
        //console.log("----compileProject.compile----")
        exmlActions.beforeBuild();
        //编译
        exmlActions.build();
        var result = this.compileProject(options);
        exmlActions.afterBuild();
        if(result.exitStatus)
            return null;

        return result;
    }
    private compilerOptions:ts.CompilerOptions;
    public compileProject(option: egret.ToolArgs, files?: egret.FileChanges) {
        //console.log("----compileProject.compileProject----")
        var compileResult: egret.CompileResult;
        if (files && this.recompile) {// console.log("----compileProject.compileProject.B-----")
            files.forEach(f=> f.fileName = f.fileName.replace(option.projectDir, ""));
            var realCWD = process.cwd();
            process.chdir(option.projectDir);

            var sourceMap = option.sourceMap;
            if(sourceMap == undefined){
                sourceMap = this.compilerOptions.sourceMap;
            }
            compileResult = this.recompile(files, sourceMap);
            process.chdir(realCWD);
        }
        else { //console.log("----compileProject.compileProject.A-----")
            var compiler = new Compiler();
            var tsList: string[] = FileUtil.search(option.srcDir, "ts");
            var libsList:string[] = FileUtil.search(option.libsDir, "ts");

            var urlConfig = option.projectDir + "tsconfig.json";//加载配置文件
            LoadConfig.loadTsConfig(urlConfig,option);
            this.compilerOptions = option.compilerOptions;

            var compileOptions = {
                args: option,
                files: tsList.concat(libsList),
                out: option.out,
                outDir: option.outDir
            };
            compileResult = compiler.compile(compileOptions);
            this.recompile = compileResult.compileWithChanges;
        }

        var fileResult: string[] = GetJavaScriptFileNames(compileResult.files, /^src\//);
        compileResult.files = fileResult;

        if (compileResult.messages.length > 0) {
            compileResult.exitStatus = 1303;
        }

        return compileResult;

    }

    private recompile: (files: egret.FileChanges, sourceMap?: boolean ) => egret.CompileResult;
}

function GetJavaScriptFileNames(tsFiles: string[],root:string|RegExp,prefix?:string) {
    var files: string[] = [];
    tsFiles.forEach(f=> {
        if (!f)
            return;
        if (/\.d\.ts$/.test(f))
            return;
        f = FileUtil.escapePath(f);
        f = f.replace(<any>root, '').replace(/\.ts$/, '.js').replace(/^\//,'');
        if (prefix) {
            f = prefix + f;
        }
        files.push(f);
    });
    return files;
}


export = CompileProject;
