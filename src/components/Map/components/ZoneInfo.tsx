import {
  IconWrapper,
  Info,
  Label,
  Title,
  Value,
  ZoneInfoWrapper,
} from './ZoneInfo.style';

const ZoneInfo = ({
  color,
  alignTop,
  withBackground,
  title,
  icon,
  values,
}: {
  color: 'blue' | 'green';
  alignTop?: boolean;
  withBackground?: boolean;
  title: string;
  icon?: string;
  values: { label: string; value: string | number }[];
}) => {
  return (
    <ZoneInfoWrapper>
      {icon && (
        <IconWrapper withBackground={withBackground}>
          <img src={`/icons/picto-${icon}.svg`} alt="" />
        </IconWrapper>
      )}
      <Info alignTop={alignTop}>
        <Title>{title}</Title>
        <div>
          {values.map(({ value, label }) => (
            <div key={label}>
              <Value color={color}>{value}</Value>
              <Label>{label}</Label>
            </div>
          ))}
        </div>
      </Info>
    </ZoneInfoWrapper>
  );
};

export default ZoneInfo;
