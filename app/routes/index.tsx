import {
  ActionIcon,
  Alert,
  AppShell,
  Box,
  Burger,
  Button,
  Code,
  CopyButton,
  Group,
  Header,
  MediaQuery,
  Navbar,
  SimpleGrid,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
  UnstyledButton,
  useMantineColorScheme,
  useMantineTheme,
} from "@mantine/core";
import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useActionData, useTransition } from "@remix-run/react";
import {
  IconAlertCircle,
  IconGitPullRequest,
  IconMoonStars,
  IconSun,
} from "@tabler/icons";
import { Configuration, OpenAIApi } from "openai";
import { useState } from "react";
import { User } from "../components/User";

const DEFAULT_VALUES = {
  name: "Carlo Badini",
  company: "Cleverclip",
  blurb:
    "Cleverclip is an agency that creates beautiful animated 2-minute explainer videos for companies. It has previously worked with both young startups and established corporations.",
  email: "drew@dropbox.com",
} as const;

export const action: ActionFunction = async ({ request }) => {
  const start = Date.now();

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
    log(`Sending request to Clearbit for email ${values.email}`);
    const res = await fetch(
      `https://person-stream.clearbit.com/v2/combined/find?email=${encodeURIComponent(
        String(values.email)
      )}`,
      { headers: { Authorization: `Bearer ${process.env.ALGOLIA_API_KEY}` } }
    );
    if (!res.ok) throw new Error("Clearbit API error");
    const clearbit = (await res.json()) as {
      person?: {
        id?: string;
        name?: {
          fullName?: string;
          givenName?: string;
          familyName?: string;
        };
        location?: string;
        employment?: {
          title?: string;
        };
      };
      company?: {
        id?: string;
        name?: string;
        description?: string;
      };
    };
    log(
      `Received response from Clearbit with user ${clearbit.person?.id} and company ${clearbit.company?.id}`
    );

    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);
    const prompt = `Write an email from ${values.name} to ${
      clearbit?.person?.name?.fullName ?? values.email
    } to pitch a product ${values.company} to ${clearbit?.company?.name}.

${clearbit?.person?.name?.fullName ?? values.email} is the ${
      clearbit?.person?.employment?.title ?? "employee"
    } of ${clearbit?.company?.name ?? ""}. ${
      clearbit?.company?.description ?? ""
    }. ${values.blurb}`;
    log(`Sending request to OpenAPI with prompt: ${JSON.stringify(prompt)}`);
    const completion = await openai.createCompletion({
      model: "text-davinci-002",
      best_of: 1,
      echo: false,
      frequency_penalty: 0,
      max_tokens: 256,
      presence_penalty: 0,
      temperature: 0.7,
      top_p: 1,
      prompt,
    });
    log(`Got response from OpenAI with ID ${completion.data.id}`);
    log(`Completed in ${Date.now() - start}ms`);
    return json({ values, logs, result: completion.data.choices[0].text });
  } catch (error) {
    console.log(error);
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
  const theme = useMantineTheme();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [opened, setOpened] = useState<boolean>(false);

  return (
    <AppShell
      padding="md"
      navbarOffsetBreakpoint="sm"
      asideOffsetBreakpoint="sm"
      navbar={
        <Navbar
          p="md"
          hiddenBreakpoint="sm"
          hidden={!opened}
          width={{ sm: 200, lg: 300 }}
        >
          <Navbar.Section grow mt="md">
            {[
              { label: "Generate", icon: <IconGitPullRequest size={16} /> },
            ].map(({ label, icon }) => (
              <UnstyledButton
                key={label}
                sx={(theme) => ({
                  display: "block",
                  width: "100%",
                  padding: theme.spacing.xs,
                  borderRadius: theme.radius.sm,
                  color:
                    colorScheme === "dark" ? theme.colors.dark[0] : theme.black,

                  "&:hover": {
                    backgroundColor:
                      colorScheme === "dark"
                        ? theme.colors.dark[6]
                        : theme.colors.gray[0],
                  },
                })}
              >
                <Group>
                  <ThemeIcon color="teal" variant="light">
                    {icon}
                  </ThemeIcon>
                  <Text>{label}</Text>
                </Group>
              </UnstyledButton>
            ))}
          </Navbar.Section>
          <Navbar.Section>
            <User />
          </Navbar.Section>
        </Navbar>
      }
      header={
        <Header height={70}>
          <Box
            sx={(theme) => ({
              paddingLeft: theme.spacing.md,
              paddingRight: theme.spacing.md,
              paddingBottom: theme.spacing.lg,
              height: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            })}
          >
            <Box
              sx={() => ({
                display: "flex",
                alignItems: "center",
              })}
            >
              <MediaQuery largerThan="sm" styles={{ display: "none" }}>
                <Burger
                  opened={opened}
                  onClick={() => setOpened((o) => !o)}
                  size="sm"
                  color={theme.colors.gray[6]}
                  mr="xl"
                />
              </MediaQuery>
              <Text size="xl">{"🛩️"}</Text>
              <Text size="xl" ml="md">
                Autopilot
              </Text>
            </Box>
            <ActionIcon
              variant="default"
              onClick={() => toggleColorScheme()}
              size={30}
            >
              {colorScheme === "dark" ? (
                <IconSun size={16} />
              ) : (
                <IconMoonStars size={16} />
              )}
            </ActionIcon>
          </Box>
        </Header>
      }
      styles={(theme) => ({
        main: {
          backgroundColor:
            colorScheme === "dark"
              ? theme.colors.dark[8]
              : theme.colors.gray[0],
        },
      })}
    >
      <SimpleGrid breakpoints={[{ minWidth: "sm", cols: 2 }]}>
        <Box>
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
              name="email"
              mt="md"
              label="Name"
              defaultValue={actionData?.values.email ?? DEFAULT_VALUES.email}
              required
            />
            <Group position="right" mt="md">
              <Button type="submit" loading={transition.state !== "idle"}>
                Generate email copy
              </Button>
            </Group>
          </Form>
        </Box>
        <Box>
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
                colorScheme === "dark"
                  ? theme.colors.dark[6]
                  : theme.colors.gray[2],
              padding: theme.spacing.xl,
              borderRadius: theme.radius.md,
              position: "relative",
            })}
          >
            <Box
              mb="sm"
              dangerouslySetInnerHTML={{
                __html: (
                  actionData?.result ??
                  `Press "Generate email copy" to get started!`
                )
                  .trim()
                  .replace(/\n/g, "<br>"),
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
        </Box>
      </SimpleGrid>
    </AppShell>
  );
}
