import { EmptyTree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { InstallOptions } from './schema';
import { NsAppType } from './NsAppType';

const collectionPath = path.join(__dirname, '../collection.json');

describe('ns-webpack-schematic', () => {
  const defaultOptions: InstallOptions = {
    force: false,
    appPath: '.'
  };
  const webpackConfigPath = '/webpack.config.js';
  const tsConfigPath = '/tsconfig.tns.json';
  const packageJsonPath = '/package.json';
  const runner = new SchematicTestRunner('schematics', collectionPath);
  let tree: UnitTestTree = new UnitTestTree(new EmptyTree);

  describe('JavaScript application', () => {
    beforeAll(() => {
      tree = setupApp(tree, NsAppType.JavaScript);
      tree = runner.runSchematic('ns-webpack-schematic', defaultOptions, tree);
    });

    afterAll(() => {
      tree = new UnitTestTree(new EmptyTree);
    });

    it('adds the webpack configuration file for {N}-JS applications', () => {
      expect(tree.files).toContain(webpackConfigPath);
      
      const content = tree.readContent(webpackConfigPath);
      expect(content).toContain('NativeScript JavaScript application');
    });

    it('adds dependency to nativescript-dev-webpack', () => {
      expect(tree.files).toContain(packageJsonPath);

      const content = tree.readContent(packageJsonPath);
      const json = JSON.parse(content);
      const { devDependencies } = json;
      expect(devDependencies['nativescript-dev-webpack']).toBeDefined();
    });
  });

  describe('TypeScript application', () => {
    beforeAll(() => {
      tree = setupApp(tree, NsAppType.TypeScript);
      tree = runner.runSchematic('ns-webpack-schematic', defaultOptions, tree);
    });

    afterAll(() => {
      tree = new UnitTestTree(new EmptyTree);
    });

    it('adds the webpack configuration file for {N}-TS applications', () => {
      expect(tree.files).toContain(webpackConfigPath);
      
      const content = tree.readContent(webpackConfigPath);
      expect(content).toContain('NativeScript TypeScript application');
    });

    it('adds a typescript config with es2015 target', () => {
      expect(tree.files).toContain(tsConfigPath);
    });

    it('adds dependency to nativescript-dev-webpack', () => {
      expect(tree.files).toContain(packageJsonPath);

      const content = JSON.parse(tree.readContent(packageJsonPath));
      const { devDependencies } = content;
      expect(devDependencies['nativescript-dev-webpack']).toBeDefined();
    });
  });

  describe('Angular application', () => {
    beforeAll(() => {
      tree = setupApp(tree, NsAppType.Angular);
      tree = runner.runSchematic('ns-webpack-schematic', defaultOptions, tree);
    });

    afterAll(() => {
      tree = new UnitTestTree(new EmptyTree);
    });

    it('adds the webpack configuration file for {N}-Angular applications', () => {
      expect(tree.files).toContain(webpackConfigPath);
      
      const content = tree.readContent(webpackConfigPath);
      expect(content).toContain('NativeScript Angular application');
    });

    it('adds a typescript config with es2015 target', () => {
      expect(tree.files).toContain(tsConfigPath);
    });

    it('adds dependency to nativescript-dev-webpack', () => {
      expect(tree.files).toContain(packageJsonPath);

      const content = JSON.parse(tree.readContent(packageJsonPath));
      const { devDependencies } = content;
      expect(devDependencies['nativescript-dev-webpack']).toBeDefined();
    });

    it('adds dependecies to other required Angular packages', () => {
      expect(tree.files).toContain(packageJsonPath);

      const content = JSON.parse(tree.readContent(packageJsonPath));
      const { devDependencies } = content;
      expect(devDependencies['@angular/compilar-cli']).toBeDefined();
      expect(devDependencies['@ngtools/webpack']).toBeDefined();
    });

    it('does not add dependency to @ngtools/webpack if build-angular is already a dependency', () => {
      const customTree = setupApp(new UnitTestTree(new EmptyTree), NsAppType.Angular);
      const packageJson = JSON.parse(customTree.readContent(packageJsonPath));
      packageJson.devDependencies = {
        ...packageJson.devDependencies,
        '@angular-devkit/build-angular': '0.8.0',
      };

      customTree.overwrite(packageJsonPath, JSON.stringify(packageJson));

      const resultTree = runner.runSchematic('ns-webpack-schematic', defaultOptions, customTree);
      const resultPackageJson = JSON.parse(resultTree.readContent(packageJsonPath));
      expect(resultPackageJson.devDependencies).not.toContain('@ngtools/webpack');
    });
  });

  describe('Already installed', () => {
     beforeAll(() => {
      tree = setupApp(tree, NsAppType.Angular);
      const packageJson = JSON.parse(tree.readContent(packageJsonPath));
      packageJson.devDependencies = {
        ...packageJson.devDependencies,
        '@angular/compilar-cli': '0.0.0',
        '@ngtools/webpack': '0.0.0',
        'nativescript-dev-webpack': '0.0.0',
      };

      tree.overwrite(packageJsonPath, JSON.stringify(packageJson));

      tree.create(webpackConfigPath, '<placeholder>');
      tree.create(tsConfigPath, '<placeholder>');
    });

    afterAll(() => {
      tree = new UnitTestTree(new EmptyTree);
    });

    describe('when force is false', () => {
      beforeAll(() => {
        tree = runner.runSchematic('ns-webpack-schematic', defaultOptions, tree);
      });

      afterAll(() => {
        tree = new UnitTestTree(new EmptyTree);
      });

      it('does not overwrite exisiting dependencies', () => {
        expect(tree.files).toContain(packageJsonPath);

        const content = JSON.parse(tree.readContent(packageJsonPath));
        const { devDependencies } = content;
        expect(devDependencies['@angular/compiler-cli']).toBe('0.0.0');
        expect(devDependencies['@ngtools/webpack']).toBe('0.0.0');
        expect(devDependencies['nativescript-dev-webpack']).toBe('0.0.0');
      });

      it('does not overwrite existing webpack configuration', () => {
        expect(tree.files).toContain(webpackConfigPath);
        const webpackConfig = tree.readContent(webpackConfigPath);
        expect(webpackConfig).toEqual('<placeholder>');
      });

      it('does not overwrite existing typescript configuration', () => {
        expect(tree.files).toContain(tsConfigPath);
        const tsConfig = tree.readContent(tsConfigPath);
        expect(tsConfig).toEqual('<placeholder>');
      });
    });

    describe('when force is true', () => {
      beforeAll(() => {
        tree = runner.runSchematic('ns-webpack-schematic', {
          ...defaultOptions,
          force: true,
        }, tree);
      });

      afterAll(() => {
        tree = new UnitTestTree(new EmptyTree);
      });

      it('overwrites exisiting dependencies', () => {
        expect(tree.files).toContain(packageJsonPath);

        const content = JSON.parse(tree.readContent(packageJsonPath));
        const { devDependencies } = content;
        expect(devDependencies['@angular/compiler-cli']).not.toBe('0.0.0');
        expect(devDependencies['@ngtools/webpack']).not.toBe('0.0.0');
        expect(devDependencies['nativescript-dev-webpack']).not.toBe('0.0.0');
      });

      it('overwrites existing webpack configuration', () => {
        expect(tree.files).toContain(webpackConfigPath);
        const webpackConfig = tree.readContent(webpackConfigPath);
        expect(webpackConfig).not.toEqual('<placeholder>');
      });

      it('overwrites existing typescript configuration', () => {
        expect(tree.files).toContain(tsConfigPath);
        const tsConfig = tree.readContent(tsConfigPath);
        expect(tsConfig).not.toEqual('<placeholder>');
      });
    });
  });
});

function setupApp(tree: UnitTestTree, type: NsAppType): UnitTestTree {
  const packageJson: any = {
    name: 'myApp',
    version: '0.0.0',
    nativescript: {
      id: 'org.nativescript.myapp',
    },
    dependencies: {
      'tns-core-modules': '4.2.0',
    },
    devDependencies: {}
  };

  if (type === NsAppType.TypeScript) {
    packageJson.devDependencies = {
      ...packageJson.devDependencies,
      'typescript': '2.7.2'
    };
  } else if (type === NsAppType.Angular) {
    packageJson.dependencies = {
      ...packageJson.dependencies,
      '@angular/core': '6.1.0',
      'nativesrcipt-angular': '6.1.0'
    };
  }

  tree.create('/package.json', JSON.stringify(packageJson));

  return tree;
}
