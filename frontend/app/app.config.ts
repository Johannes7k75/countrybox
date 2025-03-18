export default defineAppConfig({
  ui: {
    
    colors: {
      // primary: "primary",
      // neutral: 'slate',
    },
    button: {
      compoundVariants: [
        {
          color: "primary",
          variant: "solid",
          class:
            "text-(--text) font-bold bg-(--ui-primary) hover:bg-(--ui-primary)/75 disabled:bg-(--ui-primary) aria-disabled:bg-(--ui-primary) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ui-primary)",
        },
        {
          color: "secondary",
          variant: "solid",
          class:
            "text-(--text) bg-(--ui-secondary) hover:bg-(--ui-secondary)/75 disabled:bg-(--ui-secondary) aria-disabled:bg-(--ui-secondary) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ui-secondary)",
        },
      ],
    },
    tabs: {
      compoundVariants: [
        {
          color: "primary",
          variant: "pill",
          class: {
            indicator: "bg-(--ui-primary)",
            trigger:
              "data-[state=active]:text-(--text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ui-primary)",
          },
        },
      ],
    },
    // colors: {
    //     primary: "blue",
    //     neutral: "zinc"
    // }
  },
});
