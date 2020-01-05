T1 = 15;
T2 = 21;
Phi1 = 85;


SatVapPress1 = 6.122*exp(17.62*T1/(243.12+T1));
SatVapPress2 = 6.122*exp(17.62*T2/(243.12+T2));

Phi2 = (T2+273)*Phi1*SatVapPress1 / ((T1+273)*SatVapPress2)


%% graph results
T1 = -20:0.1:40;	% outside
T2 = 10:0.1:40;		% inside
Phi1 = 100;

clear Phi2
for tI1=1:length(T1)
	for tI2=1:length(T2)
		
		SatVapPress1 = 6.122*exp(17.62*T1(tI1)/(243.12+T1(tI1)));
		SatVapPress2 = 6.122*exp(17.62*T2(tI2)/(243.12+T2(tI2)));
		
		Phi2(tI1,tI2) = (T2(tI2)+273)*Phi1*SatVapPress1 / ((T1(tI1)+273)*SatVapPress2);
		
	end
end

%%
surf(T2,T1,min(Phi2,100))