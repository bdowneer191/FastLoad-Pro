import { SVGProps } from 'react';

type IconName = 'upload' | 'clipboard' | 'download' | 'magic' | 'lightbulb' | 'key' | 'chevronDown' | 'history' | 'trash' | 'sheet' | 'lock' | 'play' | 'github' | 'reddit' | 'spinner' | 'save' | 'close' | 'edit' | 'delete' | 'scan' | 'chevronUp';

const icons: Record<IconName, JSX.Element> = {
  upload: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
  ),
  clipboard: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 0 1-2.25 2.25h-1.5a2.25 2.25 0 0 1-2.25-2.25V4.5A2.25 2.25 0 0 1 9 2.25h1.5m3 4.5V7.5A2.25 2.25 0 0 0 10.5 5.25h-1.5A2.25 2.25 0 0 0 6.75 7.5v1.5m0 0v3.75c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375m-12 0h12" />
    </svg>
  ),
  download: (
     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  ),
  magic: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
  ),
  lightbulb: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.311V21m-3.75-2.311V21m0 0a2.25 2.25 0 0 1-2.25-2.25v-1.5a2.25 2.25 0 0 1 2.25-2.25m0 0h3.75m-3.75 0h-3.75m0 0a2.25 2.25 0 0 1 2.25-2.25v-1.5a2.25 2.25 0 0 1-2.25-2.25m-3.75 7.478a12.057 12.057 0 0 1-4.5 0" />
    </svg>
  ),
  key: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
    </svg>
  ),
  chevronDown: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  ),
    chevronUp: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
    </svg>
    ),
  history: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  trash: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  ),
  sheet: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  ),
  lock: (
     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 0 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H4.5a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  ),
  play: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z"/>
    </svg>
  ),
  github: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  ),
  reddit: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.0001 21.6001C17.3026 21.6001 21.6001 17.3026 21.6001 12.0001C21.6001 6.69757 17.3026 2.40002 12.0001 2.40002C6.69757 2.40002 2.40002 6.69757 2.40002 12.0001C2.40002 17.3026 6.69757 21.6001 12.0001 21.6001ZM12.0001 19.2001C8.02952 19.2001 4.80002 15.9706 4.80002 12.0001C4.80002 8.02952 8.02952 4.80002 12.0001 4.80002C15.9706 4.80002 19.2001 8.02952 19.2001 12.0001C19.2001 15.9706 15.9706 19.2001 12.0001 19.2001ZM12.0001 11.5201C11.1669 11.5201 10.4688 11.1235 10.012 10.4668C9.93922 10.356 9.80942 10.3013 9.67562 10.3341L7.75122 10.8241C7.62772 10.8543 7.53032 10.9631 7.51992 11.0906C7.50952 11.218 7.59002 11.3342 7.71212 11.3592L9.63652 11.8492C10.0384 12.8258 10.9416 13.5201 12.0001 13.5201C13.0585 13.5201 13.9617 12.8258 14.3636 11.8492L16.288 11.3592C16.4101 11.3342 16.4906 11.218 16.4802 11.0906C16.4698 10.9631 16.3724 10.8543 16.2489 10.8241L14.3245 10.3341C14.1907 10.3013 14.0609 10.356 13.9881 10.4668C13.5313 11.1235 12.8332 11.5201 12.0001 11.5201ZM8.40002 8.76002C8.99522 8.76002 9.48002 8.27522 9.48002 7.68002C9.48002 7.08482 8.99522 6.60002 8.40002 6.60002C7.80482 6.60002 7.32002 7.08482 7.32002 7.68002C7.32002 8.27522 7.80482 8.76002 8.40002 8.76002ZM15.6001 8.76002C16.1953 8.76002 16.6801 8.27522 16.6801 7.68002C16.6801 7.08482 16.1953 6.60002 15.6001 6.60002C15.0049 6.60002 14.5201 7.08482 14.5201 7.68002C14.5201 8.27522 15.0049 8.76002 15.6001 8.76002ZM14.4553 15.1118C14.2237 14.7891 13.8823 14.5715 13.5013 14.4981C12.8713 14.3781 11.1298 14.3781 10.4998 14.4981C10.1188 14.5715 9.77742 14.7891 9.54492 15.1118C9.32472 15.4184 9.25542 15.7981 9.35622 16.1558C9.45702 16.5134 9.71802 16.8122 10.0717 16.9634C10.8718 17.3018 13.1283 17.3018 13.9284 16.9634C14.2821 16.8122 14.5431 16.5134 14.6439 16.1558C14.7447 15.7981 14.6754 15.4184 14.4553 15.1118Z"/>
    </svg>
  ),
    spinner: <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>,
    save: <span>Save</span>,
    close: <span>Close</span>,
    edit: <span>Edit</span>,
    delete: <span>Delete</span>,
    scan: <span>Scan</span>,
};

interface IconProps extends SVGProps<SVGSVGElement> {
    name: IconName;
    className?: string;
}

const Icon = ({ name, className = 'w-6 h-6' }: IconProps) => {
  return <div className={className}>{icons[name]}</div>;
};

export default Icon;
export type { IconName };
