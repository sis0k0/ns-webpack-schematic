import { Rule, SchematicContext, Tree, SchematicsException, chain } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { versions } from '../versions';
import { InstallOptions } from './schema';

export interface PackageJson {
  dependencies: any;
  devDependencies: any;
}

export default function nsWebpackSchematic(options: InstallOptions): Rule {
  return chain([
    addDependencies(options),
  ]);
}

function addDependencies(options: InstallOptions) {
  return (tree: Tree, context: SchematicContext) => {
    let packageJson: PackageJson = getJsonFile(tree, '/package.json');
    packageJson.devDependencies = packageJson.devDependencies || {};
    packageJson = addCommonDeps(packageJson, options.force);

    if (isAngular) {
      packageJson = addAngularDeps(packageJson, options.force);
    }

    tree.overwrite('/package.json', JSON.stringify(packageJson));

    context.addTask(new NodePackageInstallTask());
    return tree;
  }
}

function addCommonDeps(packageJson: PackageJson, force: boolean) {
  const nsWebpack = 'nativescript-dev-webpack';
  addDevDependency(packageJson, nsWebpack, versions[nsWebpack], force);

  return packageJson;
}

function addAngularDeps(packageJson: PackageJson, force: boolean) {
  const compilerCli = '@angular/compiler-cli';
  addDevDependency(packageJson, compilerCli, versions[compilerCli], force);

  if (!packageJson.devDependencies['@angular-devkit/build-angular']) {
    const ngWebpack = '@ngtools/webpack';
    addDevDependency(packageJson, ngWebpack, versions[ngWebpack], force);
  }

  return packageJson;
}

function isAngular(packageJson: PackageJson): boolean {
  return packageJson &&
    packageJson.dependencies &&
    packageJson.dependencies['@angular/core'];
}

function addDevDependency(packageJson: PackageJson, name: string, version: string, force: boolean): void {
  if (force || !packageJson.devDependencies[name])  {
    packageJson.devDependencies[name] = version;
  }
}

const getJsonFile = <T>(tree: Tree, path: string): T => {
  const file = tree.get(path);
  if (!file) {
    throw new SchematicsException(`File ${path} could not be found!`);
  }

  try {
    const content = JSON.parse(file.content.toString());
    return content as T;
  } catch (e) {
    throw new SchematicsException(`File ${path} could not be parsed!`);
  }
};
