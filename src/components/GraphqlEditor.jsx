'use client';

import { useMemo } from 'react';

import { parseGraphQLVariables } from '@/lib/graphql';
import { useRequestStore } from '@/store/useRequestStore';

export default function GraphqlEditor() {
  const graphql = useRequestStore((state) => state.graphql);
  const setGraphql = useRequestStore((state) => state.setGraphql);
  const environments = useRequestStore((state) => state.environments);
  const activeEnvId = useRequestStore((state) => state.activeEnvId);
  const variables = environments.find((environment) => environment.id === activeEnvId)?.values ?? {};
  const validation = useMemo(() => {
    try {
      parseGraphQLVariables(graphql.variables, variables);
      return '';
    } catch (error) {
      return error.message;
    }
  }, [graphql.variables, variables]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <label className="flex min-h-0 flex-1 flex-col border-b border-[#1e1e1e]">
        <span className="border-b border-[#1e1e1e] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          GraphQL query
        </span>
        <textarea
          value={graphql.query}
          onChange={(event) => setGraphql({ query: event.target.value })}
          placeholder={'query GetUser($id: ID!) {\n  user(id: $id) { id name }\n}'}
          spellCheck={false}
          className="min-h-24 flex-1 resize-none bg-[#0d0d0d] p-3 font-mono text-xs leading-relaxed text-slate-200 focus:outline-none"
        />
      </label>

      <label className="flex min-h-0 flex-1 flex-col">
        <span className="flex items-center justify-between border-b border-[#1e1e1e] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          <span>Variables (JSON)</span>
          <span className={validation ? 'font-normal normal-case text-rose-400' : 'font-normal normal-case text-emerald-500'}>
            {validation || 'Valid JSON object'}
          </span>
        </span>
        <textarea
          value={graphql.variables}
          onChange={(event) => setGraphql({ variables: event.target.value })}
          placeholder={'{\n  "id": "1"\n}'}
          spellCheck={false}
          aria-invalid={Boolean(validation)}
          className="min-h-20 flex-1 resize-none bg-[#0d0d0d] p-3 font-mono text-xs leading-relaxed text-slate-200 focus:outline-none"
        />
      </label>
    </div>
  );
}
