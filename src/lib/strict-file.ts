import { file, type Loader } from 'astro/loaders';

/**
 * Astro's `file()` loader, except that a file it cannot load stops the build.
 *
 * `file()` catches its own failures: a file that will not parse, a missing
 * file, an item with no `id`. It logs `[ERROR] [file-loader]`, returns, and
 * the collection keeps whatever the last good run left in Astro's cache. The
 * build then reports success. Workers Builds restores that cache between
 * deploys, so a `pages.yaml` broken by one missing `#` built from the previous
 * deploy's data. It failed only because that data named an image the same PR
 * had deleted; otherwise last week's page would have gone live, reported as a
 * success. See TASKS.md F65.
 *
 * This hands `file()` a logger that also writes down any error it reports
 * while loading. If there was one, the load throws, and `astro build`,
 * `astro check` and the start of `astro dev` all fail with the reason.
 * Reloads in `astro dev` after a save still only log, as before, so a
 * half-finished edit does not take the dev server down.
 */
export function strictFile(fileName: string): Loader {
  const inner = file(fileName);
  return {
    name: 'strict-file-loader',
    load: async (context) => {
      const { logger } = context;
      const errors: string[] = [];
      // `file()` logs the parser's own message (line, column, the offending
      // line) at debug level, right after the error.
      const details: string[] = [];
      let loading = true;
      const watched = new Proxy(logger, {
        get(target, prop, receiver) {
          if (prop === 'error') {
            return (message: string) => {
              if (loading) errors.push(message);
              target.error(message);
            };
          }
          if (prop === 'debug') {
            return (message: string) => {
              if (loading && errors.length > 0) details.push(message);
              target.debug(message);
            };
          }
          return Reflect.get(target, prop, receiver);
        },
      });

      try {
        await inner.load({ ...context, logger: watched });
      } finally {
        loading = false;
      }

      if (errors.length > 0) {
        throw new Error(
          [
            `${fileName} did not load, so the build stops rather than use the copy in Astro's cache (TASKS.md F65).`,
            ...errors,
            ...details,
          ].join('\n'),
        );
      }
    },
  };
}
