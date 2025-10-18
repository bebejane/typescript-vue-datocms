import { extname } from 'path';
import { concatAST, DocumentNode, FragmentDefinitionNode, GraphQLSchema, Kind } from 'graphql';
import { oldVisit, PluginFunction, PluginValidateFn, Types } from '@graphql-codegen/plugin-helpers';
import { LoadedFragment } from '@graphql-codegen/visitor-plugin-common';
import { VueDatoCmsRawPluginConfig } from './config.js';
import { DatoCmsVisitor } from './visitor.js';

export const plugin: PluginFunction<VueDatoCmsRawPluginConfig, Types.ComplexPluginOutput> = (
	schema: GraphQLSchema,
	documents: Types.DocumentFile[],
	config: VueDatoCmsRawPluginConfig
) => {
	const allAst = concatAST(documents.map((v) => v.document as DocumentNode));
	const allFragments: LoadedFragment[] = [
		...(allAst.definitions.filter((d) => d.kind === Kind.FRAGMENT_DEFINITION) as FragmentDefinitionNode[]).map(
			(fragmentDef) => ({
				node: fragmentDef,
				name: fragmentDef.name.value,
				onType: fragmentDef.typeCondition.name.value,
				isExternal: false,
			})
		),
		...(config.externalFragments || []),
	];
	const visitor = new DatoCmsVisitor(schema, allFragments, config);
	//@ts-ignore
	const visitorResult = oldVisit(allAst, { leave: visitor });

	return {
		prepend: visitor.getImports(),
		content: [visitor.fragments, ...visitorResult.definitions.filter((t: any) => typeof t === 'string')].join('\n'),
	};
};

export const validate: PluginValidateFn<any> = async (
	schema: GraphQLSchema,
	documents: Types.DocumentFile[],
	config: VueDatoCmsRawPluginConfig,
	outputFile: string
) => {
	if (extname(outputFile) !== '.ts') {
		throw new Error(`Plugin "typescript-vue-datocms" requires extension to be ".ts"!`);
	}
};

export { DatoCmsVisitor };
