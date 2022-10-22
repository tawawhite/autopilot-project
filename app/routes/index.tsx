import {
  Alert,
  AppShell,
  Box,
  Button,
  Code,
  CopyButton,
  Grid,
  Group,
  LoadingOverlay,
  Navbar,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useActionData, useTransition } from "@remix-run/react";
import { IconAlertCircle } from "@tabler/icons";
import { Configuration, OpenAIApi } from "openai";
import { Brand } from "../components/Brand";
import { User } from "../components/User";

const DEFAULT_VALUES = {
  name: "Carlo Badini",
  company: "Cleverclip",
  blurb:
    "Cleverclip is an explainer video that created beautiful animated 2-minute videos. It has previously worked with both young startups and established corporations.",
  customerName: "Drew Huston",
  customerBlurb:
    "Dropbox is building the world's first smart workspace. Back in 2007, making work better for people meant designing a simpler way to keep files in sync. Today, it means designing products that reduce busywork so you can focus on the work that matters. Most “productivity tools” get in your way. They constantly ping, distract, and disrupt your team's flow, so you spend your days switching between apps and tracking down feedback. It's busywork, not the meaningful stuff. We want to change this. We believe there's a more enlightened way to work. Dropbox helps people be organized, stay focused, and get in sync with their teams.  ",
} as const;

export const action: ActionFunction = async ({ request }) => {
  const logs: string[] = [];
  const log = (...message: any[]) =>
    logs.push(
      `${new Date().toISOString()}: ${message
        .map((val) => String(val))
        .join(", ")}`
    );
  log("Started");
  const formData = await request.formData();
  const values = Object.fromEntries(formData);

  try {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);
    log("Sending request to OpenAPI");
    const completion = await openai.createCompletion({
      model: "text-davinci-002",
      best_of: 1,
      echo: false,
      frequency_penalty: 0,
      max_tokens: 256,
      presence_penalty: 0,
      temperature: 0.7,
      top_p: 1,
      prompt: `Write an email from ${values.name} to ${values.customerName} to pitch a product to a startup.

Product details: ${values.blurb}

Customer details: ${values.customerBlurb}`,
    });
    log(`Got response from OpenAI with ID ${completion.data.id}`);
    log("Completed");
    return json({ values, logs, result: completion.data.choices[0].text });
  } catch (error) {
    log("Errored");
    return json({ error: String(error), values, logs });
  }
};

export default function Index() {
  const transition = useTransition();
  const actionData = useActionData<{
    result?: string;
    error?: string;
    values: typeof DEFAULT_VALUES;
    logs: string[];
  }>();

  return (
    <AppShell
      padding="md"
      navbar={
        <Navbar width={{ base: 300 }} p="xs">
          <Navbar.Section mt="xs">
            <Brand />
          </Navbar.Section>
          <Navbar.Section grow mt="md">
            {/* <MainLinks /> */}
          </Navbar.Section>
          <Navbar.Section>
            <User />
          </Navbar.Section>
        </Navbar>
      }
      styles={(theme) => ({
        main: {
          backgroundColor:
            theme.colorScheme === "dark"
              ? theme.colors.dark[8]
              : theme.colors.gray[0],
        },
      })}
    >
      <Grid gutter="xl">
        <Grid.Col span={6}>
          <Form method="post">
            <Title order={2} size="h3">
              Who is sending the email?
            </Title>
            <TextInput
              name="name"
              mt="md"
              label="Name"
              defaultValue={actionData?.values.name ?? DEFAULT_VALUES.name}
              required
            />
            <TextInput
              name="company"
              mt="md"
              label="Company"
              defaultValue={
                actionData?.values.company ?? DEFAULT_VALUES.company
              }
              required
            />
            <Textarea
              name="blurb"
              mt="md"
              label="Blurb"
              defaultValue={actionData?.values.blurb ?? DEFAULT_VALUES.blurb}
              autosize
              required
            />
            <Title order={2} size="h3" mt="xl">
              Who is receiving the email?
            </Title>
            <TextInput
              name="customerName"
              mt="md"
              label="Name"
              defaultValue={
                actionData?.values.customerName ?? DEFAULT_VALUES.customerName
              }
              required
            />
            <TextInput
              mt="md"
              name="customerBlurb"
              label="Blurb"
              defaultValue={
                actionData?.values.customerBlurb ?? DEFAULT_VALUES.customerBlurb
              }
              required
            />
            <Group position="right" mt="md">
              <Button type="submit" loading={transition.state !== "idle"}>
                Generate email copy
              </Button>
            </Group>
          </Form>
        </Grid.Col>
        <Grid.Col span={6}>
          {actionData?.error && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="Bummer!"
              color="red"
              mb="xl"
              variant="filled"
            >
              {actionData.error}
            </Alert>
          )}
          <Box
            sx={(theme) => ({
              backgroundColor:
                theme.colorScheme === "dark"
                  ? theme.colors.dark[6]
                  : theme.colors.gray[2],
              padding: theme.spacing.xl,
              borderRadius: theme.radius.md,
              position: "relative",
            })}
          >
            <LoadingOverlay
              visible={transition.state !== "idle"}
              overlayBlur={2}
            />
            <Box
              mb="sm"
              dangerouslySetInnerHTML={{
                __html: (
                  actionData?.result ??
                  `Press "Generate email copy" to get started!`
                )
                  .trim()
                  .replace("\n", "<br><br>"),
              }}
            />
            <CopyButton
              value={(
                actionData?.result ??
                `Press "Generate email copy" to get started!`
              ).trim()}
            >
              {({ copied, copy }) => (
                <Button
                  color={copied ? "teal" : "dark"}
                  onClick={copy}
                  size="xs"
                >
                  {copied ? "Copied" : "Copy"}
                </Button>
              )}
            </CopyButton>
          </Box>
          <Box mt="xl">
            {actionData && actionData?.logs?.length > 0 && (
              <Code block>{actionData.logs.join("\n")}</Code>
            )}
          </Box>
        </Grid.Col>
      </Grid>
    </AppShell>
  );
}
