interface WindowTrackingExtended extends Window {
  dataLayer: any[];
  _tfa: any[];
}
declare let window: WindowTrackingExtended;

const TaboolaMarkup = ({ id }: { id: string }) => {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
        window._tfa = window._tfa || [];
        window._tfa.push({notify: 'event', name: 'page_view', id: ${id}});
        window._tfa.push({notify: 'event', name: 'view_content', id: ${id}});
        !function (t, f, a, x) {
               if (!document.getElementById(x)) {
                  t.async = 1;t.src = a;t.id=x;f.parentNode.insertBefore(t, f);
               }
        }(document.createElement('script'),
        document.getElementsByTagName('script')[0],
        '//cdn.taboola.com/libtrc/unip/${id}/tfa.js',
        'tb_tfa_script');
        `,
      }}
    />
  );
};

export default TaboolaMarkup;

export const taboolaEvent = (name: string, id: string) =>
  window._tfa && window._tfa.push({ notify: 'event', name, id });
