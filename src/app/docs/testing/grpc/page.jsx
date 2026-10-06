import DocCodeBlock from '@/components/docs/DocCodeBlock';
import { P, Section } from '@/components/docs/DocWidgets';

export const metadata = {
  title: 'Testing gRPC — OpenClient Docs',
  description: 'Set up a gRPC descriptor set and call a service with dynamic reflection.',
};

const GRPC_SETUP = `# 1. Write your proto file (api.proto)

# 2. Compile to a descriptor set — no codegen needed,
#    OpenClient reflects the messages dynamically
protoc --descriptor_set_out=api.bin api.proto

# 3. Base64-encode it
base64 -w0 api.bin        # macOS/Linux
certutil -encode api.bin api.b64 & type api.b64   # Windows

# 4. Paste the base64 string into the "Descriptor set"
#    field in the gRPC panel, then pick a service and
# method from the dropdowns and press Call.`;

export default function TestingGrpcPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-slate-100">
        Testing gRPC
      </h1>
      <Section title="Desktop app only">
        <P>
          OpenClient uses dynamic protobuf reflection, so
          there is no codegen step — you compile a descriptor set once and
          paste it in.
        </P>
        <DocCodeBlock title="terminal" code={GRPC_SETUP} />
        <P>
          Expected: the service and method dropdowns populate from
          reflection. Streaming methods are rejected with UNIMPLEMENTED
          instead of silently hanging.
        </P>
      </Section>
    </>
  );
}
